export type JobSearchDocument = {
  readonly title: string;
  readonly city: string;
  readonly employerName: string;
  readonly skills: readonly string[];
};

export function tokenizeJobQuery(query: string): readonly string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export function matchesJobQuery(
  document: JobSearchDocument,
  tokens: readonly string[],
): boolean {
  if (tokens.length === 0) return true;
  const haystack = [
    document.title,
    document.city,
    document.employerName,
    ...document.skills,
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}
