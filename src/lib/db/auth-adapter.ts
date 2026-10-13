import "server-only";
import type { DatabaseSync } from "node:sqlite";
import type { BetterAuthOptions } from "better-auth";
import {
  type AdapterFactory,
  type CustomAdapter,
  createAdapterFactory,
  type Where,
} from "better-auth/adapters";
import { openAuthDatabase } from "./sqlite";

type CleanedWhere = Required<Where>;
type SqlValue = string | number | null;
type SortBy = { readonly field: string; readonly direction: "asc" | "desc" };
type Condition = {
  readonly clause: string;
  readonly params: readonly SqlValue[];
};

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const EQUALITY_OPERATORS: Readonly<Record<string, string>> = {
  eq: "=",
  ne: "!=",
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">=",
};
const PATTERN_TEMPLATES: Readonly<Record<string, string>> = {
  contains: "%VALUE%",
  starts_with: "VALUE%",
  ends_with: "%VALUE",
};

function identifierOf(value: string): string {
  if (!IDENTIFIER.test(value)) {
    throw new Error(`Identifier SQL tidak valid: ${value}`);
  }
  return value;
}

function toSqlValue(value: unknown): SqlValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function placeholdersOf(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}

function equalityCondition(where: CleanedWhere): Condition | null {
  const column = identifierOf(where.field);
  const comparison = EQUALITY_OPERATORS[where.operator];
  if (comparison === undefined) return null;
  const value = toSqlValue(where.value);
  if (value === null) {
    if (where.operator === "eq") {
      return { clause: `${column} IS NULL`, params: [] };
    }
    if (where.operator === "ne") {
      return { clause: `${column} IS NOT NULL`, params: [] };
    }
    return { clause: "0 = 1", params: [] };
  }
  const suffix = where.mode === "insensitive" ? " COLLATE NOCASE" : "";
  return { clause: `${column}${suffix} ${comparison} ?`, params: [value] };
}

function membershipCondition(where: CleanedWhere): Condition | null {
  if (where.operator !== "in" && where.operator !== "not_in") return null;
  const column = identifierOf(where.field);
  const entries = Array.isArray(where.value) ? where.value : [where.value];
  if (entries.length === 0) {
    return { clause: where.operator === "in" ? "0 = 1" : "1 = 1", params: [] };
  }
  const params = entries.map(toSqlValue);
  const keyword = where.operator === "in" ? "IN" : "NOT IN";
  return {
    clause: `${column} ${keyword} (${placeholdersOf(params.length)})`,
    params,
  };
}

function patternCondition(where: CleanedWhere): Condition | null {
  const template = PATTERN_TEMPLATES[where.operator];
  if (template === undefined) return null;
  const column = identifierOf(where.field);
  const raw =
    typeof where.value === "string" ? where.value : JSON.stringify(where.value);
  return {
    clause: `${column} LIKE ? ESCAPE '\\'`,
    params: [template.replace("VALUE", escapeLike(raw))],
  };
}

function conditionOf(where: CleanedWhere): Condition {
  const condition =
    equalityCondition(where) ??
    membershipCondition(where) ??
    patternCondition(where);
  return condition ?? { clause: "1 = 1", params: [] };
}

function whereClauseOf(where: readonly CleanedWhere[] | undefined): Condition {
  if (where === undefined || where.length === 0) {
    return { clause: "", params: [] };
  }
  const parts: string[] = [];
  const params: SqlValue[] = [];
  where.forEach((entry, index) => {
    if (index > 0) {
      parts.push(entry.connector === "OR" ? "OR" : "AND");
    }
    const condition = conditionOf(entry);
    parts.push(condition.clause);
    params.push(...condition.params);
  });
  return { clause: ` WHERE ${parts.join(" ")}`, params };
}

function selectionOf(select: readonly string[] | undefined): string {
  if (select === undefined || select.length === 0) return "*";
  return select.map(identifierOf).join(", ");
}

function sortingOf(sortBy: SortBy | undefined): string {
  if (sortBy === undefined) return "";
  const direction = sortBy.direction === "desc" ? "DESC" : "ASC";
  return ` ORDER BY ${identifierOf(sortBy.field)} ${direction}`;
}

function entriesOf(data: Record<string, unknown>): {
  readonly columns: readonly string[];
  readonly values: readonly SqlValue[];
} {
  const columns = Object.keys(data).map(identifierOf);
  return { columns, values: columns.map((column) => toSqlValue(data[column])) };
}

function createHandlers(database: DatabaseSync): CustomAdapter {
  return {
    async create<T extends Record<string, unknown>>({
      data,
      model,
      select,
    }: {
      model: string;
      data: T;
      select?: string[] | undefined;
    }): Promise<T> {
      const { columns, values } = entriesOf(data);
      const row = database
        .prepare(
          `INSERT INTO ${identifierOf(model)} (${columns.join(", ")}) VALUES (${placeholdersOf(columns.length)}) RETURNING ${selectionOf(select)}`,
        )
        .get(...values);
      return row as T;
    },

    async update<T>({
      where,
      model,
      update,
    }: {
      model: string;
      where: CleanedWhere[];
      update: T;
    }): Promise<T | null> {
      const { columns, values } = entriesOf(update as Record<string, unknown>);
      const assignments = columns.map((column) => `${column} = ?`).join(", ");
      const condition = whereClauseOf(where);
      const row = database
        .prepare(
          `UPDATE ${identifierOf(model)} SET ${assignments}${condition.clause} RETURNING *`,
        )
        .get(...values, ...condition.params);
      return (row ?? null) as T | null;
    },

    async updateMany({ where, model, update }) {
      const { columns, values } = entriesOf(update);
      const assignments = columns.map((column) => `${column} = ?`).join(", ");
      const condition = whereClauseOf(where);
      const result = database
        .prepare(
          `UPDATE ${identifierOf(model)} SET ${assignments}${condition.clause}`,
        )
        .run(...values, ...condition.params);
      return Number(result.changes);
    },

    async findOne<T>({
      where,
      model,
      select,
    }: {
      model: string;
      where: CleanedWhere[];
      select?: string[] | undefined;
    }): Promise<T | null> {
      const condition = whereClauseOf(where);
      const row = database
        .prepare(
          `SELECT ${selectionOf(select)} FROM ${identifierOf(model)}${condition.clause} LIMIT 1`,
        )
        .get(...condition.params);
      return (row ?? null) as T | null;
    },

    async findMany<T>({
      where,
      model,
      limit,
      select,
      sortBy,
      offset,
    }: {
      model: string;
      where?: CleanedWhere[] | undefined;
      limit: number;
      select?: string[] | undefined;
      sortBy?: SortBy | undefined;
      offset?: number | undefined;
    }): Promise<T[]> {
      const condition = whereClauseOf(where);
      const params: SqlValue[] = [...condition.params];
      let pagination = "";
      if (limit !== undefined) {
        pagination += " LIMIT ?";
        params.push(limit);
      }
      if (offset !== undefined) {
        pagination += " OFFSET ?";
        params.push(offset);
      }
      const rows = database
        .prepare(
          `SELECT ${selectionOf(select)} FROM ${identifierOf(model)}${condition.clause}${sortingOf(sortBy)}${pagination}`,
        )
        .all(...params);
      return rows as T[];
    },

    async delete({ where, model }) {
      const condition = whereClauseOf(where);
      database
        .prepare(`DELETE FROM ${identifierOf(model)}${condition.clause}`)
        .run(...condition.params);
    },

    async deleteMany({ where, model }) {
      const condition = whereClauseOf(where);
      const result = database
        .prepare(`DELETE FROM ${identifierOf(model)}${condition.clause}`)
        .run(...condition.params);
      return Number(result.changes);
    },

    async count({ where, model }) {
      const condition = whereClauseOf(where);
      const row = database
        .prepare(
          `SELECT COUNT(*) AS total FROM ${identifierOf(model)}${condition.clause}`,
        )
        .get(...condition.params) as { total: number } | undefined;
      return row?.total ?? 0;
    },
  };
}

export function createAuthDatabase(): AdapterFactory<BetterAuthOptions> {
  return createAdapterFactory({
    config: {
      adapterId: "sqlite-dev",
      usePlural: false,
      supportsDates: false,
      supportsBooleans: false,
      supportsJSON: false,
      supportsNumericIds: false,
      transaction: false,
    },
    adapter: () => createHandlers(openAuthDatabase()),
  });
}