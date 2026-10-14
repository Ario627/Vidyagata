import "server-only";
import {
  type RegulatoryParameterError,
  type RegulatoryParameterKey,
  type RegulatoryParameterRecord,
  type RegulatoryParameterSet,
  resolveRegulatoryParameters,
} from "@/domain/regulatory/parameters";
import type { Result } from "@/domain/shared/result";
import { db } from "@/lib/db/client";

type ParameterRow = {
  key: string;
  value_json: string;
  effective_from: string;
  effective_to: string | null;
  source: string;
};

const SELECT_ALL = `SELECT key, value_json, effective_from, effective_to, source
FROM regulatory_parameters
ORDER BY key, effective_from`;

function toRecord(row: ParameterRow): RegulatoryParameterRecord {
  return {
    key: row.key as RegulatoryParameterKey,
    value: JSON.parse(row.value_json),
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    source: row.source,
  };
}

export async function allParameterRecords(): Promise<
  readonly RegulatoryParameterRecord[]
> {
  const rows = (await db.prepare(SELECT_ALL).all()) as ParameterRow[];
  return rows.map(toRecord);
}

export async function resolveActiveParameters(
  at: string,
): Promise<Result<RegulatoryParameterSet, RegulatoryParameterError>> {
  return resolveRegulatoryParameters(await allParameterRecords(), at);
}
