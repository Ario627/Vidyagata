import { type NextRequest, NextResponse } from "next/server";
import { type SubmitPaymentError, submitMyPayment } from "@/data/payments";
import { getCurrentUser } from "@/lib/session";

const ERROR_STATUS: Readonly<Record<SubmitPaymentError, number>> = {
  installment_not_found: 404,
  installment_settled: 409,
  amount_mismatch: 422,
  invalid_proof: 415,
  payment_pending_exists: 409,
};

const ERROR_MESSAGES: Readonly<Record<SubmitPaymentError, string>> = {
  installment_not_found: "Cicilan tidak ditemukan.",
  installment_settled: "Cicilan ini sudah lunas, tidak perlu dibayar lagi.",
  amount_mismatch:
    "Nominal transfer harus sama persis dengan total tagihan cicilan ini.",
  invalid_proof:
    "Bukti transfer harus berupa JPG, PNG, atau PDF maksimal 4 MB.",
  payment_pending_exists:
    "Sudah ada bukti transfer untuk cicilan ini yang menunggu verifikasi.",
};

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return false;
  const host = request.headers.get("host");
  if (host === null) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { ok: false, code: "forbidden_origin" },
      { status: 403 },
    );
  }
  const user = await getCurrentUser();
  if (user === null) {
    return NextResponse.json(
      { ok: false, code: "unauthorized" },
      { status: 401 },
    );
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }
  const installmentId = form.get("installmentId");
  const amountRaw = form.get("amount");
  const senderName = form.get("senderName");
  const note = form.get("note");
  const file = form.get("file");
  if (
    typeof installmentId !== "string" ||
    typeof amountRaw !== "string" ||
    typeof senderName !== "string" ||
    !(file instanceof File)
  ) {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }
  const amount = Number.parseInt(amountRaw, 10);
  const sender = senderName.trim();
  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    sender.length < 3 ||
    sender.length > 120 ||
    installmentId.length > 64
  ) {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }
  const normalizedNote =
    typeof note === "string" && note.trim() !== ""
      ? note.trim().slice(0, 280)
      : undefined;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await submitMyPayment({
    installmentId,
    amount,
    senderName: sender,
    note: normalizedNote,
    bytes,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, message: ERROR_MESSAGES[result.code] },
      { status: ERROR_STATUS[result.code] },
    );
  }
  return NextResponse.json({ ok: true, paymentId: result.paymentId });
}
