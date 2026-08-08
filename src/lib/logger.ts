/**
 * Minimal structured logger for server-side operations.
 * Never log secrets, tokens, passwords, or source content here.
 */
type LogFields = {
  requestId?: string;
  userId?: string;
  documentId?: string;
  sourceId?: string;
  operation: string;
  durationMs?: number;
  error?: unknown;
  [key: string]: unknown;
};

function sanitize(fields: LogFields) {
  const safe: Record<string, unknown> = { operation: fields.operation };
  for (const key of [
    "requestId",
    "userId",
    "documentId",
    "sourceId",
    "durationMs",
  ] as const) {
    if (fields[key] !== undefined) safe[key] = fields[key];
  }
  if (fields.error !== undefined) {
    safe.error =
      fields.error instanceof Error
        ? fields.error.message
        : String(fields.error);
  }
  return safe;
}

export function logOperation(fields: LogFields) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...sanitize(fields) });
  if (fields.error) {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function makeRequestId(): string {
  return crypto.randomUUID();
}
