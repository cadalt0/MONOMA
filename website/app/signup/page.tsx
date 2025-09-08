"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import { Check, ChevronRight, Lock, CircleDot, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { AnimatedDropdownMenu } from "@/components/ui/animated-dropdown-menu"
import { MapPin } from "lucide-react"
import { isValidEvmAddress, toPaddedRecipient, createWalletsForAllChains } from "@/lib/wallet"
import { upsertMonomaUserWithRetry, fetchMonomaUser } from "@/lib/users"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<"login" | "selection" | "creating" | "complete">("login")
  const [selectedChains, setSelectedChains] = useState<string[]>([])
  const [arbitrumAddress, setArbitrumAddress] = useState("")
  const [createdAddresses, setCreatedAddresses] = useState<{ [key: string]: string }>({})
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const googleInitializedRef = useRef<boolean>(false)
  const googleRenderedRef = useRef<boolean>(false)
  const [googleUiReady, setGoogleUiReady] = useState<boolean>(false)
  const [showGoogleNotice, setShowGoogleNotice] = useState<boolean>(false)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const apiBaseUrl = process.env.NEXT_PUBLIC_API || ""
  const [addressError, setAddressError] = useState<string>("")
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [apiWallets, setApiWallets] = useState<Record<string, string>>({})
  const [userEmail, setUserEmail] = useState<string>("")
  const [userSaved, setUserSaved] = useState<boolean>(false)
  const [checkingExisting, setCheckingExisting] = useState<boolean>(true)
  // No custom click handler; we rely entirely on Google's rendered button

  // Available chains - only these 4 are selectable
  const availableChains = [
    {
      name: "Ethereum",
      id: "eth",
      icon: "https://cdn-icons-png.flaticon.com/128/14446/14446160.png",
      available: true,
    },
    {
      name: "Avalanche",
      id: "avax",
      icon: "https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/avalanche.png",
      available: true,
    },
    {
      name: "Base",
      id: "base",
      icon: "https://avatars.githubusercontent.com/u/108554348?s=280&v=4",
      available: true,
    },
    {
      name: "Solana",
      id: "sol",
      icon: "https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/solana.png",
      available: false,
    },
  ]

  // All chains from footer ticker (landing page)
  const footerChains = [
    "Avalanche",
    "Base",
    "Codex",
    "Ethereum",
    "Linea",
    "OP Mainnet",
    "Polygon PoS",
    "Sei",
    "Solana",
    "Sonic",
    "Unichain",
    "World Chain",
  ]

  const chainIconByName: Record<string, string> = {
    Ethereum: "https://cdn-icons-png.flaticon.com/128/14446/14446160.png",
    Avalanche: "https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/avalanche.png",
    Base: "https://avatars.githubusercontent.com/u/108554348?s=280&v=4",
    Linea: "https://moralis.com/wp-content/uploads/2024/04/Linea-Chain-Icon.svg",
    "OP Mainnet": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqidBq62tBzMjwxpb9WljM3BuKe6oEHzbJ6Q&s",
    "Polygon PoS": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-UjZYpTKlVQWhKF3Sf3camP-rCTZ_OZnqcA&s",
    Sei: "https://tw.mitrade.com/cms_uploads/img/20230816/9fa1c5943c8af63ea49970c8697e986c.jpg",
    Solana: "https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/solana.png",
    Sonic: "https://s2.coinmarketcap.com/static/img/coins/200x200/32684.png",
    Unichain: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIOk2BmIfo12hx0k8FiNNC9MJgop2AAEIoFg&s",
    "World Chain": "https://static1.tokenterminal.com//worldchain/logo.png?logo_hash=786762db10d4891532210e063b6501ac6ad715a9",
    Codex: "/placeholder.svg",
  }

  // Derive coming soon list = all footer chains minus the 4 available ones
  const availableNames = new Set(availableChains.map((c) => c.name))
  const comingSoonChains = footerChains.filter((name) => !availableNames.has(name))

  useEffect(() => {
    // If we already have an email (previous login), check DB and redirect immediately
    try {
      const existingEmail = (localStorage.getItem("monomaEmail") || "").trim()
      if (existingEmail) {
        ;(async () => {
          try {
            const rec = await fetchMonomaUser(apiBaseUrl, existingEmail)
            if (rec && rec.account) {
              router.push("/home")
              return
            }
            // If user exists without account, show selection; else stay on login
            if (rec && !rec.account) setStep("selection")
          } catch {}
          setCheckingExisting(false)
        })()
        return
      }
    } catch {}
    setCheckingExisting(false)
  }, [])

  useEffect(() => {
    if (step !== "login") return
    if (!googleClientId) return

    const existing = document.getElementById("google-gsi-client") as HTMLScriptElement | null
    const load = () => {
      // @ts-expect-error - google may not be typed on window
      const google = window.google
      if (!google) return
      if (!googleInitializedRef.current) {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (resp: any) => {
            try {
              const token = resp?.credential as string | undefined
              if (token) {
                const [, payload] = token.split(".")
                if (payload) {
                  const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
                  if (json?.email) {
                    setUserEmail(json.email as string)
                    try {
                      localStorage.setItem("monomaEmail", json.email as string)
                    } catch {}
                  }
                }
              }
            } catch {}
            // After capturing email, check DB for existing account
            ;(async () => {
              try {
                const email = (localStorage.getItem("monomaEmail") || userEmail || "").trim()
                if (email) {
                  const rec = await fetchMonomaUser(apiBaseUrl, email)
                  if (rec && rec.account) {
                    router.push("/home")
                    return
                  }
                }
              } catch {}
              setStep("selection")
            })()
          },
        })
        googleInitializedRef.current = true
      }
      if (googleButtonRef.current && !googleRenderedRef.current) {
        try {
          google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "filled_black",
            size: "large",
            width: 360,
            logo_alignment: "left",
            type: "standard",
            text: "continue_with",
            shape: "pill",
          })
          googleRenderedRef.current = true
          setGoogleUiReady(true)
          setShowGoogleNotice(false)
        } catch {}
      }
    }

    if (!existing) {
      const script = document.createElement("script")
      script.id = "google-gsi-client"
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = load
      document.body.appendChild(script)
    } else if (existing && existing.dataset.loaded !== "true") {
      existing.addEventListener("load", load, { once: true })
    } else {
      load()
    }

    return () => {
      // no-op cleanup
    }
  }, [step, googleClientId])

  useEffect(() => {
    if (step !== "login") return
    setShowGoogleNotice(false)
    setGoogleUiReady(false)
    const t = window.setTimeout(() => {
      try {
        const hasBtn = !!(googleButtonRef.current?.querySelector('[role="button"]') as HTMLDivElement | null)
        if (!hasBtn) setShowGoogleNotice(true)
      } catch {
        setShowGoogleNotice(true)
      }
    }, 3500)
    return () => window.clearTimeout(t)
  }, [step])

  const handleGoogleLogin = () => {
    try {
      // @ts-expect-error - google may not be typed on window
      const google = window.google
      // If the Google-rendered button exists, programmatically click it
      const btn = googleButtonRef.current?.querySelector('[role="button"]') as HTMLDivElement | null
      if (btn) {
        btn.click()
        return
      }
      // If not rendered yet, load script and render, then click
      const existing = document.getElementById("google-gsi-client") as HTMLScriptElement | null
      if (!existing) {
        const script = document.createElement("script")
        script.id = "google-gsi-client"
        script.src = "https://accounts.google.com/gsi/client"
        script.async = true
        script.defer = true
        script.onload = () => {
          try {
            const g = (window as unknown as { google?: any }).google
            if (!g) return
            if (!googleInitializedRef.current) {
              g.accounts.id.initialize({
                client_id: googleClientId,
                callback: (resp: any) => {
                  try {
                    const token = resp?.credential as string | undefined
                    if (token) {
                      const [, payload] = token.split(".")
                      if (payload) {
                        const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
                        if (json?.email) {
                          setUserEmail(json.email as string)
                          try {
                            localStorage.setItem("monomaEmail", json.email as string)
                          } catch {}
                        }
                      }
                    }
                  } catch {}
                  ;(async () => {
                    try {
                      const email = (localStorage.getItem("monomaEmail") || userEmail || "").trim()
                      if (email) {
                        const rec = await fetchMonomaUser(apiBaseUrl, email)
                        if (rec && rec.account) {
                          router.push("/home")
                          return
                        }
                      }
                    } catch {}
                    setStep("selection")
                  })()
                },
              })
              googleInitializedRef.current = true
            }
            if (googleButtonRef.current && !googleRenderedRef.current) {
              g.accounts.id.renderButton(googleButtonRef.current, {
                theme: "filled_black",
                size: "large",
                width: 360,
                logo_alignment: "left",
                type: "standard",
                text: "continue_with",
                shape: "pill",
              })
              googleRenderedRef.current = true
            }
            const buttonEl = googleButtonRef.current?.querySelector('[role="button"]') as HTMLDivElement | null
            if (buttonEl) buttonEl.click()
          } catch {}
        }
        document.body.appendChild(script)
      }
    } catch {}
  }

  const handleChainToggle = (chainId: string) => {
    if (selectedChains.includes(chainId)) {
      setSelectedChains(selectedChains.filter((id) => id !== chainId))
    } else {
      setSelectedChains([...selectedChains, chainId])
    }
  }

  const handleCreateAccount = async () => {
    setAddressError("")
    if (!isValidEvmAddress(arbitrumAddress)) {
      setAddressError("Enter a valid EVM address (0x + 40 hex)")
      return
    }
    if (!apiBaseUrl) {
      setAddressError("Missing NEXT_PUBLIC_API in env")
      return
    }

    setIsCreating(true)
    setStep("creating")
    try {
      const padded = toPaddedRecipient(arbitrumAddress)
      const res = await createWalletsForAllChains(apiBaseUrl, padded)
      setApiWallets(res)

      // Normalize keys and map to our chain IDs
      const byKey = Object.fromEntries(
        Object.entries(res).map(([k, v]) => [k.toUpperCase(), v])
      ) as Record<string, string>

      // Progressive UI updates for each selected chain
      const chainAddressById: Record<string, string | undefined> = {
        eth: byKey.ETH,
        base: byKey.BASE,
        avax: byKey.AVALANCHE,
        // Keep Solana mocked as requested
        sol: `SoL${Math.random().toString(36).slice(2, 34)}`,
      }

      for (const chainId of selectedChains) {
        const addr = chainAddressById[chainId]
        // Small delay to visualize progress
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 600))
        if (addr) {
          setCreatedAddresses((prev) => ({ ...prev, [chainId]: addr }))
        }
      }

      // Also finalize here as a safety in case the effect doesn't trigger for any reason
      const allReadyNow = selectedChains.every((id) => !!chainAddressById[id])
      if (allReadyNow && selectedChains.length > 0) {
        const smartwalletsDb = Object.fromEntries(
          Object.entries(res).map(([k, v]) => [k.toLowerCase(), v])
        ) as Record<string, string>
        if (chainAddressById.sol) smartwalletsDb["solana"] = chainAddressById.sol
        try {
          await upsertMonomaUserWithRetry(apiBaseUrl, {
            email: userEmail || "user@example.com",
            smartwallets: smartwalletsDb,
            account: true,
            chains: selectedChains.join(","),
            destinedAddress: arbitrumAddress,
          })
          setUserSaved(true)
        } catch {}
        setStep("complete")
        setTimeout(() => {
          router.push("/home")
        }, 1500)
      }
    } catch (e: any) {
      setAddressError(e?.message || "Failed to create wallets")
      setStep("selection")
    } finally {
      setIsCreating(false)
    }
  }

  // When all selected chains have been populated with addresses, finish and redirect
  useEffect(() => {
    if (step !== "creating") return
    const allReady = selectedChains.every((id) => !!createdAddresses[id])
    if (allReady && selectedChains.length > 0) {
      ;(async () => {
        try {
          const smartwalletsDb = Object.fromEntries(
            Object.entries(apiWallets).map(([k, v]) => [k.toLowerCase(), v])
          ) as Record<string, string>
          if (createdAddresses.sol) smartwalletsDb["solana"] = createdAddresses.sol
          await upsertMonomaUserWithRetry(apiBaseUrl, {
            email: userEmail || "user@example.com",
            smartwallets: smartwalletsDb,
            account: true,
            chains: selectedChains.join(","),
            destinedAddress: arbitrumAddress,
          })
          setUserSaved(true)
        } catch {}
        setStep("complete")
        const t = setTimeout(() => {
          router.push("/home")
        }, 1500)
        return () => clearTimeout(t)
      })()
    }
  }, [createdAddresses, selectedChains, step, router])

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-6 left-6 z-20 flex items-center space-x-3"
      >
        <img
          src="/logo.png"
          alt="Monoma Logo"
          className="w-12 h-12 md:w-16 md:h-16 object-contain"
        />
        <span className="text-white font-bold text-2xl md:text-4xl">Monoma</span>
      </motion.div>

      <div className="relative z-10 flex w-full items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {checkingExisting && (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-24"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                />
              </motion.div>
            )}
            {step === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome to Monoma</h1>
                  <p className="text-white/70 text-sm md:text-base">Sign in to create your multi-chain wallet</p>
                  <div className="flex justify-center">
                    <button
                      onClick={handleGoogleLogin}
                      className="inline-flex items-center gap-3 bg-white text-black font-medium rounded-full px-4 py-2 shadow hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.602 32.329 29.17 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.84 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.065 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.739 15.108 18.981 12 24 12c3.059 0 5.84 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.065 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                        <path fill="#4CAF50" d="M24 44c5.113 0 9.77-1.947 13.292-5.129l-6.146-5.2C29.11 35.091 26.715 36 24 36c-5.148 0-9.563-3.243-11.158-7.773l-6.51 5.02C9.639 39.556 16.284 44 24 44z"/>
                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.095 3.246-3.414 5.866-6.157 7.258l.001-.001 6.146 5.2C33.146 41.886 38 38 40.889 33.222 42.24 30.659 43 27.45 43 24c0-1.341-.138-2.651-.389-3.917z"/>
                      </svg>
                      <span className="text-sm">Continue with Google</span>
                    </button>
                    <div ref={googleButtonRef} className="sr-only" aria-hidden />
                  </div>
                </div>
              </motion.div>
            )}

            {step === "selection" && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Create On-Chain Accounts</h1>
                  <p className="text-white/70 text-sm md:text-base">Select chains to create wallets on</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-white/70 text-xs md:text-sm">Supported now</p>
                  </div>
                  <AnimatedDropdownMenu
                    options={comingSoonChains.map((label) => ({
                      label: `${label} (Coming soon)`,
                      onClick: () => {},
                      Icon: (
                        <img
                          src={chainIconByName[label] || "/placeholder.svg"}
                          alt={label}
                          className="w-4 h-4"
                        />
                      ),
                    }))}
                  >
                    <span className="text-white/80 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Coming soon
                    </span>
                  </AnimatedDropdownMenu>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar mt-3">
                  {availableChains.map((chain) => (
                    <motion.div
                      key={chain.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-3 md:p-4 rounded-lg border cursor-pointer transition-all ${
                        chain.available
                          ? selectedChains.includes(chain.id)
                            ? "border-[#CFFF04] bg-[#CFFF04]/10"
                            : "border-white/20 bg-white/5 hover:border-white/40"
                          : "border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50"
                      }`}
                      onClick={() => chain.available && handleChainToggle(chain.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={chain.icon || "/placeholder.svg"}
                            alt={chain.name}
                            className="w-5 h-5 md:w-6 md:h-6"
                          />
                          <span className="text-white font-medium text-sm md:text-base">{chain.name}</span>
                        </div>
                        {chain.available ? (
                          selectedChains.includes(chain.id) && (
                            <img
                              src="/logo.png"
                              alt="Selected"
                              className="w-5 h-5 md:w-6 md:h-6 object-contain"
                            />
                          )
                        ) : (
                          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">Coming Soon</span>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  <div className="mt-4 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-white/80" />
                    <h3 className="text-white font-semibold text-sm md:text-base">Destination</h3>
                  </div>
                  <div className="p-3 md:p-4 rounded-lg border border-white/20 bg-white/5 cursor-not-allowed hover:cursor-not-allowed">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src="https://cdn3d.iconscout.com/3d/premium/thumb/arbitrum-arb-3d-icon-png-download-11757502.png"
                          alt="Arbitrum"
                          className="w-5 h-5 md:w-6 md:h-6"
                        />
                        <span className="text-white font-medium text-sm md:text-base">Arbitrum (Destination)</span>
                      </div>
                      <Lock className="w-4 h-4 md:w-5 md:h-5 text-[#CFFF04]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70">Arbitrum Address (Optional)</label>
                  <Input
                    placeholder="0x... (leave empty to generate new)"
                    value={arbitrumAddress}
                    onChange={(e) => {
                      const v = e.target.value
                      setArbitrumAddress(v)
                      if (v && !isValidEvmAddress(v)) {
                        setAddressError("Enter a valid EVM address (0x + 40 hex)")
                      } else {
                        setAddressError("")
                      }
                    }}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 text-sm md:text-base"
                  />
                  {addressError && (
                    <p className="text-xs text-red-400 mt-1">{addressError}</p>
                  )}
                </div>

                <Button
                  onClick={handleCreateAccount}
                  disabled={selectedChains.length === 0 || (!!arbitrumAddress && !isValidEvmAddress(arbitrumAddress)) || isCreating}
                  className="w-full bg-[#CFFF04] text-black hover:bg-[#E0E722] font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  size="lg"
                >
                  {isCreating ? "Creating Wallets..." : "Create On-Chain Accounts"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {step === "creating" && (
              <motion.div
                key="creating"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-[#CFFF04] rounded-full flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-6 h-6 md:w-8 md:h-8 border-2 border-black border-t-transparent rounded-full"
                    />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Creating Accounts</h2>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
                  {selectedChains.map((chainId) => {
                    const chain = availableChains.find((c) => c.id === chainId)
                    const isCreated = createdAddresses[chainId]

                    return (
                      <motion.div
                        key={chainId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-white/5"
                      >
                        <img
                          src={chain?.icon || "/placeholder.svg"}
                          alt={chain?.name}
                          className="w-4 h-4 md:w-5 md:h-5"
                        />
                        <span className="text-white flex-1 text-sm md:text-base">{chain?.name}</span>
                        {isCreated ? (
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#CFFF04]" />
                        ) : (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="w-3 h-3 md:w-4 md:h-4 border border-white border-t-transparent rounded-full"
                          />
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {step === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-[#CFFF04] rounded-full flex items-center justify-center"
                  >
                    <Check className="w-6 h-6 md:w-8 md:h-8 text-black" />
                  </motion.div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Accounts Created!</h2>
                  <p className="text-white/70 text-sm md:text-base">Redirecting to dashboard...</p>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
                  {Object.entries(createdAddresses).map(([chainId, address]) => {
                    const chain = availableChains.find((c) => c.id === chainId)
                    return (
                      <div key={chainId} className="p-3 rounded-lg bg-white/5 text-left">
                        <div className="flex items-center space-x-2 mb-1">
                          <img
                            src={chain?.icon || "/placeholder.svg"}
                            alt={chain?.name}
                            className="w-3 h-3 md:w-4 md:h-4"
                          />
                          <span className="text-white font-medium text-xs md:text-sm">{chain?.name}</span>
                        </div>
                        <p className="text-xs text-white/60 font-mono break-all">{address}</p>
                      </div>
                    )
                  })}

                  {arbitrumAddress && (
                    <div className="p-3 rounded-lg bg-white/5 text-left">
                      <div className="flex items-center space-x-2 mb-1">
                        <img
                          src="https://cdn3d.iconscout.com/3d/premium/thumb/arbitrum-arb-3d-icon-png-download-11757502.png"
                          alt="Arbitrum"
                          className="w-3 h-3 md:w-4 md:h-4"
                        />
                        <span className="text-white font-medium text-xs md:text-sm">Arbitrum</span>
                      </div>
                      <p className="text-xs text-white/60 font-mono break-all">{arbitrumAddress}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {showGoogleNotice && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="rounded-full bg-black/70 text-white px-4 py-2 text-xs md:text-sm shadow">
              Google login didn’t load. Please reload :)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
