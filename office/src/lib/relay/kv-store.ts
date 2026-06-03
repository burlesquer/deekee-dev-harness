/**
 * Minimal Upstash/Vercel KV REST adapter (no SDK — uses fetch + the command protocol).
 *
 * Activates when KV_REST_API_URL/KV_REST_API_TOKEN (Vercel KV) or
 * UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN (Upstash) are present.
 * Without them every call is a safe no-op, so the registries transparently
 * fall back to in-memory state (prod stays healthy before KV is provisioned).
 */

const REST_URL =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '';
const REST_TOKEN =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

const REQUEST_TIMEOUT_MS = 5000;

export function kvEnabled(): boolean {
  return REST_URL.length > 0 && REST_TOKEN.length > 0;
}

/**
 * Run a single Redis command over the REST protocol.
 * Body is a JSON array: ["GET", key] / ["SET", key, value].
 * Returns the parsed `result` field, or null on any failure.
 */
async function command(args: (string | number)[]): Promise<unknown> {
  if (!kvEnabled()) return null;
  try {
    const res = await fetch(REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error('[kv-store] command failed', args[0], res.status);
      return null;
    }
    const json = (await res.json()) as { result?: unknown; error?: string };
    if (json.error) {
      console.error('[kv-store] command error', args[0], json.error);
      return null;
    }
    return json.result ?? null;
  } catch (err) {
    console.error('[kv-store] command threw', args[0], err);
    return null;
  }
}

/** GET a JSON value by key. Returns null when missing, disabled, or on error. */
export async function kvGetJSON<T>(key: string): Promise<T | null> {
  const raw = await command(['GET', key]);
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** SET a JSON value by key. Resolves silently; failures are logged, not thrown. */
export async function kvSetJSON(key: string, value: unknown): Promise<void> {
  await command(['SET', key, JSON.stringify(value)]);
}
