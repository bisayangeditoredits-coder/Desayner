/**
 * Lightweight observability helpers for API routes.
 * Usage:
 *   const start = Date.now();
 *   // ... handler code ...
 *   logRequestDuration('GET /api/designers', start);
 */

export function logRequestDuration(label: string, start: number) {
  const duration = Date.now() - start;
  const level = duration > 2000 ? 'SLOW' : duration > 500 ? 'WARN' : 'OK';
  console.log(
    `[${new Date().toISOString()}] [${level}] ${label} — ${duration}ms`
  );
}

/**
 * Wrap an async handler to automatically log its duration.
 */
export function withTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  return fn().finally(() => logRequestDuration(label, start));
}
