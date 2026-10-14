import "server-only";
import { db } from "@/lib/db/client";

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

export async function listInstitutionOptions(): Promise<
  readonly InstitutionOption[]
> {
  const rows = (await db.prepare(SELECT_OPTIONS).all()) as InstitutionRow[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    province: row.province,
  }));
}
