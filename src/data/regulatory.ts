import "server-only";
import {
  type RegulatoryParameterError,
  type RegulatoryParameterKey,
  type RegulatoryParameterRecord,
  type RegulatoryParameterSet,
  resolveRegulatoryParameters,
} from "@/domain/regulatory/parameters";
import type { Result } from "@/domain/shared/result";
import { openAuthDatabase } from "@/lib/db/sqlite";

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

export function allParameterRecords(): readonly RegulatoryParameterRecord[] {
  const rows = openAuthDatabase().prepare(SELECT_ALL).all() as ParameterRow[];
  return rows.map(toRecord);
}

export function resolveActiveParameters(
  at: string,
): Result<RegulatoryParameterSet, RegulatoryParameterError> {
  return resolveRegulatoryParameters(allParameterRecords(), at);
}
