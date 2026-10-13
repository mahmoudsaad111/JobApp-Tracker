/** Extracts a readable message from an HttpErrorResponse-like value. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { error?: unknown } | null)?.error;
  if (!body) return fallback;
  if (typeof body === 'string') return body.trim() || fallback;
  if (typeof body !== 'object') return fallback;

  const obj = body as Record<string, unknown>;
  const parts: string[] = [];

  const message = obj['message'] ?? obj['Message'];
  if (typeof message === 'string' && message.trim()) parts.push(message.trim());

  const errors = obj['errors'] ?? obj['Errors'];
  if (Array.isArray(errors)) {
    for (const e of errors) if (typeof e === 'string' && e.trim()) parts.push(e.trim());
  } else if (errors && typeof errors === 'object') {
    for (const v of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        for (const e of v) {
          if (typeof e === 'string') parts.push(e);
        }
      } else if (typeof v === 'string') {
        parts.push(v);
      }
    }
  }

  if (!parts.length && typeof obj['title'] === 'string') parts.push(obj['title'] as string);

  const unique = Array.from(new Set(parts));
  return unique.length ? unique.join(' ') : fallback;
}
