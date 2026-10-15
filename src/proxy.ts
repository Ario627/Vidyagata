import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "better-auth.session_token";
const SECURE_SESSION_COOKIE = `__Secure-${SESSION_COOKIE}`;

const SESSION_GUARDED_ROUTES = [
  "/dashboard",
  "/pembiayaan",
  "/kerja",
  "/tagihan",
  "/riwayat",
  "/performa",
  "/profil",
  "/mbak-vidya",
  "/notifikasi",
  "/operator",
] as const;

const NONCE_RENDERED_ROUTES = [
  ...SESSION_GUARDED_ROUTES,
  "/masuk",
  "/masuk/dua-faktor",
  "/daftar",
] as const;

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has(SESSION_COOKIE) ||
    request.cookies.has(SECURE_SESSION_COOKIE)
  );
}

function isUnder(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "report-uri /api/metrics/csp",
    isDev ? "" : "upgrade-insecure-requests",
  ];
  return directives.filter((directive) => directive.length > 0).join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isUnder(pathname, SESSION_GUARDED_ROUTES) && !hasSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);

  if (!isUnder(pathname, NONCE_RENDERED_ROUTES)) {
    return NextResponse.next({ request: { headers } });
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = buildContentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === "development",
  );
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pembiayaan/:path*",
    "/kerja/:path*",
    "/tagihan/:path*",
    "/riwayat/:path*",
    "/performa/:path*",
    "/profil/:path*",
    "/mbak-vidya/:path*",
    "/notifikasi/:path*",
    "/operator/:path*",
    "/masuk",
    "/masuk/dua-faktor",
    "/daftar",
    "/lupa-akses/:path*",
  ],
};
