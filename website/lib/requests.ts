export interface MonomaRequestPayload {
  payid?: string
  email: string
  smartwallets: Record<string, string>
  amount: number
  descriptions?: string
}

export async function createMonomaRequest(baseUrl: string, payload: MonomaRequestPayload): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/monomarequests`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Create request failed (${res.status}): ${text}`)
  }
}

export interface MonomaRequestRecord {
  payid: string
  email: string
  smartwallets: Record<string, string>
  amount: string
  status?: string | null
  hash?: string | null
  descriptions?: string | null
  created_at?: string
  updated_at?: string
}

export async function fetchMonomaRequest(baseUrl: string, payid: string): Promise<MonomaRequestRecord | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/monomarequests/${encodeURIComponent(payid)}`
  const res = await fetch(url, { method: "GET" })
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Fetch request failed (${res.status}): ${text}`)
  }
  const raw = await res.json().catch(() => null)
  if (!raw) return null
  const inner = typeof raw === "object" && raw && "request" in raw ? (raw as any).request : raw
  if (!inner || typeof inner !== "object") return null
  const rec: MonomaRequestRecord = {
    payid: String(inner.payid || ""),
    email: String(inner.email || ""),
    smartwallets: (inner.smartwallets as Record<string, string>) || {},
    amount: String(inner.amount ?? "0"),
    status: (inner.status as string | null) ?? null,
    hash: (inner.hash as string | null) ?? null,
    descriptions: (inner.descriptions as string | null) ?? null,
    created_at: inner.created_at as string | undefined,
    updated_at: inner.updated_at as string | undefined,
  }
  return rec
}


