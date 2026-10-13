import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 16_384;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

type CspReportBody = {
  "csp-report"?: {
    "violated-directive"?: unknown;
    "blocked-uri"?: unknown;
    "document-uri"?: unknown;
  };
};

function summarize(body: CspReportBody): string {
  const report = body["csp-report"];
  if (report === undefined) return "laporan CSP tanpa payload";
  const directive = String(report["violated-directive"] ?? "tidak diketahui");
  const blocked = String(report["blocked-uri"] ?? "tidak diketahui");
  const document = String(report["document-uri"] ?? "tidak diketahui");
  return [directive, blocked, document]
    .map((part) => part.replace(CONTROL_CHARS, "").slice(0, 200))
    .join(" | ");
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  if (process.env.NODE_ENV === "development") {
    try {
      const body = JSON.parse(raw) as CspReportBody;
      process.stdout.write(`\n[CSP report] ${summarize(body)}\n`);
    } catch {
      process.stdout.write("\n[CSP report] payload tidak bisa dibaca\n");
    }
  }

  return new NextResponse(null, { status: 204 });
}
