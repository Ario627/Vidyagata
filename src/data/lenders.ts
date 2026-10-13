import "server-only";
import { z } from "zod";
import { type Rupiah, rupiah } from "@/domain/money/money";
import { openAuthDatabase } from "@/lib/db/sqlite";

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
  risk_appetite_json: string;
};

const SELECT_PILOT = `SELECT id, risk_appetite_json FROM lenders
WHERE status IN ('pilot', 'active')
ORDER BY created_at, id
LIMIT 1`;

function parseAppetite(raw: string): z.infer<typeof RiskAppetite> | null {
  try {
    const parsed = RiskAppetite.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function getPilotLenderTerms(): LenderTerms | null {
  const row = openAuthDatabase().prepare(SELECT_PILOT).get() as
    | LenderRow
    | undefined;
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
