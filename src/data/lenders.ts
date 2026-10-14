import "server-only";
import { z } from "zod";
import { type Rupiah, rupiah } from "@/domain/money/money";
import { db } from "@/lib/db/client";

export type LenderTerms = {
  readonly lenderId: string;
  readonly marginRateBp: number;
  readonly serviceFeeRateBp: number;
  readonly maxTenorMonths: number;
  readonly maxAmount: Rupiah;
};

const RiskAppetite = z.object({
  max_amount: z.int().nonnegative().max(1_000_000_000),
  max_tenor_months: z.int().min(1).max(360),
  margin_rate_bp: z.int().min(0).max(99_999),
  service_fee_rate_bp: z.int().min(0).max(99_999),
});

type LenderRow = {
  id: string;
  risk_appetite_json: string | Record<string, unknown>;
};

const SELECT_PILOT = `SELECT id, risk_appetite_json FROM lenders
WHERE status IN ('pilot', 'active')
ORDER BY created_at, id
LIMIT 1`;

function parseAppetite(raw: unknown): z.infer<typeof RiskAppetite> | null {
  try {
    const decoded = typeof raw === "string" ? JSON.parse(raw) : raw;
    const parsed = RiskAppetite.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function getPilotLenderTerms(): Promise<LenderTerms | null> {
  const row = (await db.prepare(SELECT_PILOT).get()) as LenderRow | undefined;
  if (row === undefined) return null;
  const appetite = parseAppetite(row.risk_appetite_json);
  if (appetite === null) return null;
  return {
    lenderId: row.id,
    marginRateBp: appetite.margin_rate_bp,
    serviceFeeRateBp: appetite.service_fee_rate_bp,
    maxTenorMonths: appetite.max_tenor_months,
    maxAmount: rupiah(appetite.max_amount),
  };
}
