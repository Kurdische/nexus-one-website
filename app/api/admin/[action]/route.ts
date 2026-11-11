import { NextRequest, NextResponse } from "next/server";
import {
  adminCookie, createAdminSession, getAdminSession, isAdminConfigured, revokeAdminSession, validCsrf, verifyAdmin,
} from "@/lib/server/auth";
import { adminBodyLimit, formLimit, isAdminView, mutateContent } from "@/lib/server/admin-content";
import { BodyTooLarge, isSameOrigin, rateLimit, readForm, requestMime, requestOrigin } from "@/lib/server/request";

export const runtime = "nodejs";

function response(status: number, message: string, retryAfter?: number) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (retryAfter) headers.set("Retry-After", String(retryAfter));
  return NextResponse.json({ message }, { status, headers });
}

function redirect(request: Request, notice?: string, view?: string) {
  const url = new URL("/admin", requestOrigin(request)!);
  if (notice) url.searchParams.set("notice", notice);
  if (view && isAdminView(view)) url.searchParams.set("view", view);
  return NextResponse.redirect(url, { status: 303, headers: { "Cache-Control": "no-store" } });
}

async function login(request: NextRequest) {
  const retryAfter = rateLimit(request, "admin-login", 5, 15 * 60);
  if (retryAfter) {
    return response(429, "Zu viele Anmeldeversuche. Bitte versuche es später erneut.", retryAfter);
  }

  let form: FormData;
  try {
    form = await readForm(request, formLimit);
  } catch {
    return redirect(request, "login-invalid");
  }
  const email = form.get("email");
  const password = form.get("password");
  if (typeof email !== "string" || email.length > 254 || typeof password !== "string" ||
      !await verifyAdmin(email, password)) return redirect(request, "login-invalid");

  const cookie = adminCookie();
  const previous = getAdminSession(request.cookies.get(cookie.name)?.value);
  if (previous) revokeAdminSession(previous.idHash);
  const result = redirect(request);
  result.cookies.set(cookie.name, createAdminSession(), cookie.options);
  return result;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action !== "login" && action !== "logout" && !isAdminView(action)) return response(404, "Aktion nicht verfügbar.");
  if (!isAdminConfigured()) return response(503, "Die Administration ist derzeit nicht eingerichtet.");
  if (!isSameOrigin(request)) return response(403, "Diese Anfrage ist nicht zulässig.");

  const mime = requestMime(request);
  const canUpload = action === "downloads" || action === "screenshots";
  if (mime !== "application/x-www-form-urlencoded" && !(canUpload && mime === "multipart/form-data")) {
    return response(415, "Dieses Datenformat wird nicht unterstützt.");
  }

  if (action === "login") return login(request);

  const cookie = adminCookie();
  const value = request.cookies.get(cookie.name)?.value;
  if (getAdminSession(value)?.role !== "admin") return redirect(request, "expired");

  let form: FormData;
  try {
    form = await readForm(request, action === "logout" ? formLimit : adminBodyLimit(action));
  } catch (error) {
    return redirect(request, error instanceof BodyTooLarge ? "too-large" : "invalid", action);
  }
  const session = getAdminSession(value);
  if (!session) return redirect(request, "expired");
  if (!validCsrf(form.get("csrf"), session.csrf)) return response(403, "Diese Anfrage ist nicht zulässig.");

  if (action === "logout") {
    revokeAdminSession(session.idHash);
    const result = redirect(request, "logged-out");
    result.cookies.set(cookie.name, "", { ...cookie.options, maxAge: 0 });
    return result;
  }
  return redirect(request, await mutateContent(action, form), action);
}
