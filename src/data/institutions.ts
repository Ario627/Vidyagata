import "server-only";
import { openAuthDatabase } from "@/lib/db/sqlite";

export type InstitutionOption = {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly province: string;
};

type InstitutionRow = {
  id: string;
  name: string;
  city: string;
  province: string;
};

const SELECT_OPTIONS = `SELECT id, name, city, province FROM institutions
WHERE partnership_status <> 'inactive'
ORDER BY name`;

export function listInstitutionOptions(): readonly InstitutionOption[] {
  const rows = openAuthDatabase()
    .prepare(SELECT_OPTIONS)
    .all() as InstitutionRow[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    province: row.province,
  }));
}
