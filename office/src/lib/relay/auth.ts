/**
 * Relay API authentication helper.
 * When RELAY_SECRET env var is set, all mutating requests must include
 * the matching `x-relay-secret` header.
 * GET (read-only / SSE) endpoints are intentionally excluded from auth.
 */
export function validateRelaySecret(req: Request): boolean {
  const secret = req.headers.get('x-relay-secret');
  return secret === process.env.RELAY_SECRET;
}
