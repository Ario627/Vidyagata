import { type NextRequest, NextResponse } from "next/server";
import { readPaymentProofForViewer } from "@/data/payments";

const EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

const PROOF_SECURITY_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Cross-Origin-Resource-Policy": "same-origin",
  Vary: "Cookie",
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await params;
  const proof = await readPaymentProofForViewer({ paymentId });
  if (proof === null) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const extension = EXTENSIONS[proof.mime] ?? "bin";
  const inline = proof.mime.startsWith("image/");
  const body = new Uint8Array(proof.bytes);
  return new NextResponse(body, {
    status: 200,
    headers: {
      ...PROOF_SECURITY_HEADERS,
      "Content-Type": proof.mime,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="bukti-transfer-${paymentId.slice(-8)}.${extension}"`,
    },
  });
}
