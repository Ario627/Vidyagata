import { type NextRequest, NextResponse } from "next/server";
import { readDocumentForViewer } from "@/data/documents";

const EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

const DOCUMENT_SECURITY_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Cross-Origin-Resource-Policy": "same-origin",
  Vary: "Cookie",
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const document = await readDocumentForViewer({ documentId: id });
  if (document === null) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const extension = EXTENSIONS[document.meta.mime] ?? "bin";
  const inline = document.meta.mime.startsWith("image/");
  const body = new Uint8Array(document.bytes);
  return new NextResponse(body, {
    status: 200,
    headers: {
      ...DOCUMENT_SECURITY_HEADERS,
      "Content-Type": document.meta.mime,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${document.meta.kind}-${document.meta.id.slice(-8)}.${extension}"`,
    },
  });
}
