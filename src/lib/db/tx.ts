import "server-only";
import type { Db } from "./client";

export async function inTransaction<T>(
  database: Db,
  operation: () => Promise<T>,
): Promise<T> {
  return database.transaction(operation);
}
