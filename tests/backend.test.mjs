import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { crc32 } from "node:zlib";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const next = join(root, "node_modules", "next", "dist", "bin", "next");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jIRUAAAAASUVORK5CYII=", "base64");

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}

function smtpSink() {
  const state = { messages: [], reject: false };
  const server = createServer((socket) => {
    let buffer = "";
    let data = null;
    socket.setEncoding("utf8");
    socket.write("220 loopback.test ESMTP\r\n");
    socket.on("error", () => {});
    socket.on("data", (chunk) => {
      buffer += chunk;
      let end = buffer.indexOf("\r\n");
      while (end >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (data !== null) {
          if (line === ".") {
            if (!state.reject) state.messages.push(data.join("\n"));
            socket.write(state.reject ? "554 Message rejected\r\n" : "250 Message accepted\r\n");
            data = null;
          } else data.push(line);
        } else if (/^EHLO /i.test(line)) {
          socket.write("250-loopback.test\r\n250 PIPELINING\r\n");
        } else if (/^(MAIL FROM:|RCPT TO:)/i.test(line)) {
          socket.write("250 OK\r\n");
        } else if (/^DATA$/i.test(line)) {
          data = [];
          socket.write("354 End with a dot\r\n");
        } else if (/^QUIT$/i.test(line)) {
          socket.end("221 Bye\r\n");
        } else {
          socket.write("500 Unsupported command\r\n");
        }
        end = buffer.indexOf("\r\n");
      }
    });
  });
  return { server, state };
}

function zipFixture() {
  const name = Buffer.from("test.txt");
  const data = Buffer.from("Isolated download test");
  const checksum = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + name.length, 12);
  end.writeUInt32LE(local.length + name.length + data.length, 16);
  return Buffer.concat([local, name, data, central, name, end]);
}

function formData(fields) {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  return form;
}

function notice(response) {
  const location = response.headers.get("location");
  return location ? new URL(location).searchParams.get("notice") : null;
}

async function waitForSite(site, process, log) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (process.exitCode !== null) break;
    try {
      const result = await fetch(`${site}/admin`, { signal: AbortSignal.timeout(2000) });
      if (result.ok) return;
    } catch {
      // The server may still be binding its port.
    }
    await delay(400);
  }
  assert.fail(`Production server unavailable. Run npm run build before the tests.\n${log()}`);
}

test("production backend protects administration, publishes real assets, and sends mail through SMTP", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "nexus-backend-test-"));
  const smtp = smtpSink();
  const smtpPort = await listen(smtp.server);
  const reservation = createServer();
  const port = await listen(reservation);
  const closed = once(reservation, "close");
  reservation.close();
  await closed;
  const site = `http://127.0.0.1:${port}`;
  const password = randomBytes(24).toString("base64url");
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 65536, r: 8, p: 2, maxmem: 96 * 1024 * 1024 });
  const email = "administrator@example.test";

  const appProcess = spawn(process.execPath, [next, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXUS_SITE_URL: site,
      NEXUS_ACCESS_LOCAL_BYPASS: "true",
      NEXUS_DATA_DIR: directory,
      NEXUS_ADMIN_EMAIL: email,
      NEXUS_ADMIN_PASSWORD_HASH: `scrypt-v1:${salt.toString("hex")}:${hash.toString("hex")}`,
      NEXUS_SESSION_SECRET: randomBytes(32).toString("base64url"),
      NEXUS_CLIENT_IP_HEADER: "",
      NEXUS_SMTP_HOST: "127.0.0.1",
      NEXUS_SMTP_PORT: String(smtpPort),
      NEXUS_SMTP_SECURE: "false",
      NEXUS_SMTP_ALLOW_INSECURE: "true",
      NEXUS_SMTP_USER: "",
      NEXUS_SMTP_PASSWORD: "",
      NEXUS_CONTACT_FROM: "website@example.test",
      NEXUS_CONTACT_TO: "inbox@example.test",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let logs = "";
  for (const stream of [appProcess.stdout, appProcess.stderr]) {
    stream.on("data", (chunk) => { logs = (logs + chunk).slice(-5000); });
  }
  t.after(async () => {
    if (appProcess.exitCode === null && appProcess.signalCode === null) {
      const stopped = once(appProcess, "exit");
      appProcess.kill();
      await stopped;
    }
    smtp.server.close();
    await rm(directory, { recursive: true, force: true, maxRetries: 3 });
  });
  await waitForSite(site, appProcess, () => logs);

  const get = (path, cookie) => fetch(site + path, { headers: cookie ? { cookie } : undefined });
  const post = (action, body, { cookie, origin = site } = {}) => fetch(`${site}/api/admin/${action}`, {
    method: "POST",
    headers: { origin, ...(cookie ? { cookie } : {}) },
    body,
    redirect: "manual",
  });
  const contact = (body, origin = site) => fetch(`${site}/api/contact`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const loginPage = await (await get("/admin")).text();
  assert.match(loginPage, /Administrator-Anmeldung/);
  assert.doesNotMatch(loginPage, /Neue App hinzufügen/);
  assert.equal(notice(await post("apps", new URLSearchParams({ operation: "remove", slug: "jarvis" }))), "expired");
  assert.equal((await post("login", new URLSearchParams({ email, password }), { origin: "https://other.example" })).status, 403);
  assert.equal(notice(await post("login", new URLSearchParams({ email, password: `${password}x` }))), "login-invalid");

  const login = await post("login", new URLSearchParams({ email, password }));
  assert.equal(login.status, 303);
  const setCookie = login.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  const cookie = setCookie.split(";")[0];
  const dashboard = await (await get("/admin", cookie)).text();
  assert.match(dashboard, /Neue App hinzufügen/);
  const csrf = dashboard.match(/name="csrf" value="([A-Za-z0-9_-]+)"/)?.[1];
  assert.equal(csrf?.length, 43);
  const submit = (action, fields) => post(action, new URLSearchParams({ csrf, ...fields }), { cookie });
  assert.equal((await submit("apps", { operation: "remove", slug: "jarvis", csrf: "invalid" })).status, 403);

  const slug = "qa-demo";
  const newApp = {
    operation: "create", slug, name: "QA Demo", category: "Produktivität",
    description: "Isolierter Testeintrag", accent: "#7960ff", icon: "sparkles", status: "listed",
  };
  assert.equal(notice(await submit("apps", newApp)), "saved");
  assert.equal(notice(await submit("apps", {
    ...newApp, operation: "edit", status: "beta", features: "Bestätigte Testfunktion",
  })), "saved");
  const product = await (await get(`/apps/${slug}`)).text();
  assert.match(product, /QA Demo/);
  assert.match(product, /Bestätigte Testfunktion/);

  const release = {
    csrf, operation: "create", appSlug: slug, platform: "Web", version: "qa.1",
    releasedAt: "2025-05-10", changelog: "Isolierter Testrelease",
  };
  const falseZip = formData(release);
  falseZip.set("file", new Blob(["not an archive"]), "fake.zip");
  assert.equal(notice(await post("downloads", falseZip, { cookie })), "invalid");
  const zip = zipFixture();
  const downloadForm = formData(release);
  downloadForm.set("file", new Blob([zip]), "qa-release.zip");
  assert.equal(notice(await post("downloads", downloadForm, { cookie })), "saved");
  const downloads = await (await get("/downloads")).text();
  const downloadPath = downloads.match(/\/api\/downloads\/[a-f0-9-]{36}/)?.[0];
  assert.ok(downloadPath);
  const download = await get(downloadPath);
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("content-disposition"), 'attachment; filename="qa-release.zip"');
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), zip);

  const image = formData({ csrf, operation: "create", appSlug: slug, alt: "Testbild" });
  image.set("file", new Blob([png]), "screenshot.png");
  assert.equal(notice(await post("screenshots", image, { cookie })), "saved");
  const productWithImage = await (await get(`/apps/${slug}`)).text();
  const screenshotPath = productWithImage.match(/(?:\/|%2F)api(?:\/|%2F)screenshots(?:\/|%2F)[a-f0-9-]{36}/)?.[0];
  assert.ok(screenshotPath);
  const screenshot = await get(decodeURIComponent(screenshotPath));
  assert.equal(screenshot.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await screenshot.arrayBuffer()), png);

  assert.equal(notice(await submit("updates", {
    operation: "create", appSlug: slug, title: "Isolierte Ankündigung",
    category: "announcement", body: "Dieser Eintrag existiert nur im Test.", publishedAt: "2025-05-10",
  })), "saved");
  assert.match(await (await get("/updates")).text(), /Isolierte Ankündigung/);
  assert.equal(notice(await submit("apps", { operation: "remove", slug })), "removed");
  assert.equal((await get(downloadPath)).status, 404);
  assert.equal((await get(decodeURIComponent(screenshotPath))).status, 404);
  assert.equal((await get(`/apps/${slug}`)).status, 404);
  assert.equal(notice(await submit("logout", {})), "logged-out");
  assert.equal(notice(await submit("apps", { operation: "remove", slug: "jarvis" })), "expired");

  const message = {
    name: "QA Sender", email: "sender@example.test", subject: "SMTP test",
    message: "SMTP accepted this real relay test.",
  };
  assert.equal((await contact(message, "https://other.example")).status, 403);
  assert.equal((await contact({ ...message, email: "invalid" })).status, 422);
  assert.equal((await contact({ ...message, website: "spam" })).status, 400);
  assert.equal(smtp.state.messages.length, 0);
  const sent = await contact(message);
  assert.equal(sent.status, 200);
  assert.deepEqual(await sent.json(), { ok: true });
  assert.match(smtp.state.messages[0], /Reply-To: QA Sender <sender@example.test>/);
  assert.match(smtp.state.messages[0], /SMTP accepted this real relay test/);
  smtp.state.reject = true;
  assert.equal((await contact(message)).status, 502);
  assert.equal((await contact(message)).status, 502);
  assert.equal((await contact(message)).status, 429);
});
