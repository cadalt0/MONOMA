export type CreateWalletResponse = Record<string, string>

export function isValidEvmAddress(address: string): boolean {
  if (!address) return false
  const trimmed = address.trim()
  return /^0x[a-fA-F0-9]{40}$/.test(trimmed)
}

// Pads an EVM address to 0x + 24 zeros + 40-hex (already 40) => useful if upstream expects canonical 32-byte hex
export function toPaddedRecipient(address: string): string {
  const hex = address.replace(/^0x/, "").toLowerCase()
  // Ensure 40 hex chars for EVM address
  const clean = hex.padStart(40, "0").slice(-40)
  // 24 zeros + 40 chars
  const twentyFourZeros = "0".repeat(24)
  return `0x${twentyFourZeros}${clean}`
}

export async function createWalletsForAllChains(baseUrl: string, mintRecipient: string): Promise<CreateWalletResponse> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/create-wallet-all`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mintRecipient }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Create wallet failed (${res.status}): ${text}`)
  }
  // Try JSON first
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const json = (await res.json().catch(() => null)) as CreateWalletResponse | null
    if (json && typeof json === "object") return json
  }
  // Fallback: parse plain text like:
  // ETH: 0x...
  // BASE: 0x...
  // AVALANCHE: 0x...
  const textBody = await res.text().catch(() => "")
  if (textBody) {
    const out: Record<string, string> = {}
    for (const rawLine of textBody.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line) continue
      const idx = line.indexOf(":")
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      if (key && value) out[key] = value
    }
    if (Object.keys(out).length > 0) return out
  }
  throw new Error("Invalid response from wallet API")
}


