const MAX_QUERY_LENGTH = 100;
const MAX_TERMS = 8;

/** Sanitize user input for Postgres full-text search (websearch / OR syntax). */
export function sanitizeFtsQuery(raw) {
  const trimmed = (raw || '').trim().slice(0, MAX_QUERY_LENGTH);
  if (!trimmed) return '';

  const terms = trimmed
    .split(/\s+/)
    .map((term) => term.replace(/[|&!():*<>]/g, '').trim())
    .filter(Boolean)
    .slice(0, MAX_TERMS);

  return terms.join(' | ');
}
