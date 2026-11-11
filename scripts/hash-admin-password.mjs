import { randomBytes, scryptSync } from "node:crypto";

if (process.stdin.isTTY) {
  process.stderr.write("Pipe a password from a masked prompt into stdin. See the README.\n");
  process.exit(1);
}

process.stdin.setEncoding("utf8");
let input = "";
for await (const chunk of process.stdin) {
  input += chunk;
  if (input.length > 257) break;
}

const password = input.replace(/\r?\n$/, "");
if (password.length < 12 || password.length > 256 || /[\r\n]/.test(password)) {
  process.stderr.write("The password must contain 12–256 characters on one line.\n");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N: 65536, r: 8, p: 2, maxmem: 96 * 1024 * 1024 });
process.stdout.write(`scrypt-v1:${salt.toString("hex")}:${hash.toString("hex")}\n`);
