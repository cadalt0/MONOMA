export type SmartWallets = Record<string, string>

export interface MonomaUserPayload {
  email: string
  smartwallets: SmartWallets
  account: boolean
  chains: string
  destinedAddress: string
}

export async function upsertMonomaUser(baseUrl: string, payload: MonomaUserPayload): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/monomausers`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`User upsert failed (${res.status}): ${text}`)
  }
}

export async function upsertMonomaUserWithRetry(
  baseUrl: string,
  payload: MonomaUserPayload,
  maxRetries = 3,
  baseDelayMs = 400,
): Promise<void> {
  let attempt = 0
  let lastErr: unknown
  while (attempt < maxRetries) {
    try {
      await upsertMonomaUser(baseUrl, payload)
      return
    } catch (e) {
      lastErr = e
      attempt += 1
      if (attempt >= maxRetries) break
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("User upsert failed after retries")
}

export interface MonomaUserRecord {
  email: string
  smartwallets?: Record<string, string>
  account?: boolean
  chains?: string
  destinedAddress?: string
}

export async function fetchMonomaUser(baseUrl: string, email: string): Promise<MonomaUserRecord | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/monomausers/${encodeURIComponent(email)}`
  const res = await fetch(url, { method: "GET" })
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Fetch user failed (${res.status}): ${text}`)
  }
  const raw = await res.json().catch(() => null)
  if (!raw) return null
  const inner = typeof raw === "object" && raw && "user" in raw ? (raw as any).user : raw
  if (!inner || typeof inner !== "object") return null
  const normalized: MonomaUserRecord = {
    email: inner.email as string,
    smartwallets: inner.smartwallets as Record<string, string> | undefined,
    account: Boolean(inner.account),
    chains: (inner.chains as string | undefined) ?? undefined,
    destinedAddress: (inner.destinedAddress as string | undefined) ?? (inner.destined_address as string | undefined),
  }
  return normalized
}


