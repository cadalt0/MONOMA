"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { fetchMonomaUser } from "@/lib/users"
import { createMonomaRequest } from "@/lib/requests"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import { Copy, Plus, Send, User, LogOut, ChevronDown, Clock, CheckCircle, XCircle, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showSmartWallets, setShowSmartWallets] = useState(false)
  const [requestAmount, setRequestAmount] = useState("")
  const [requestChain, setRequestChain] = useState("")
  const [requestDescription, setRequestDescription] = useState("")
  const [requestCreatedUrl, setRequestCreatedUrl] = useState("")
  const [requestSaving, setRequestSaving] = useState(false)

  // Smart wallets loaded from DB/localStorage payload if available
  const [userAddresses, setUserAddresses] = useState<Record<string, string>>({})
  const [userChains, setUserChains] = useState<string[]>([])

  const paymentHistory = [
    {
      id: 1,
      amount: "0.5",
      chain: "eth",
      status: "completed",
      description: "Payment for services",
      date: "2024-01-15",
      from: "0x1234...5678",
    },
    {
      id: 2,
      amount: "100",
      chain: "avax",
      status: "pending",
      description: "Invoice #001",
      date: "2024-01-14",
      from: "0xabcd...efgh",
    },
    {
      id: 3,
      amount: "25.5",
      chain: "base",
      status: "failed",
      description: "Refund request",
      date: "2024-01-13",
      from: "0x9876...5432",
    },
    {
      id: 4,
      amount: "2.1",
      chain: "sol",
      status: "completed",
      description: "Product purchase",
      date: "2024-01-12",
      from: "9WzD...AWWM",
    },
  ]

  const chainNames = {
    eth: "Ethereum",
    avax: "Avalanche",
    base: "Base",
    sol: "Solana",
    arbitrum: "Arbitrum",
  }

  const chainIcons = {
    eth: "https://cdn-icons-png.flaticon.com/128/14446/14446160.png",
    avax: "https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/avalanche.png",
    base: "https://avatars.githubusercontent.com/u/108554348?s=280&v=4",
    sol: "https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/solana.png",
    arbitrum: "https://cdn3d.iconscout.com/3d/premium/thumb/arbitrum-arb-3d-icon-png-download-11757502.png",
  }

  const [userEmail, setUserEmail] = useState("")

  const apiBaseUrl = process.env.NEXT_PUBLIC_API || ""

  useEffect(() => {
    try {
      const e = localStorage.getItem("monomaEmail") || ""
      setUserEmail(e)
    } catch {}
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!userEmail || !apiBaseUrl) return
      try {
        const rec = await fetchMonomaUser(apiBaseUrl, userEmail)
        if (rec) {
          // Normalize chains list to our internal ids (e.g., avalanche -> avax)
          const chains = (rec.chains || "")
            .split(",")
            .map((c) => c.trim().toLowerCase())
            .filter(Boolean)
          setUserChains(chains)

          // Normalize smartwallets keys
          const wallets: Record<string, string> = {}
          if (rec.smartwallets && typeof rec.smartwallets === "object") {
            for (const [key, addr] of Object.entries(rec.smartwallets)) {
              const k = key.toLowerCase()
              const mapped = k === "avalanche" ? "avax" : k
              wallets[mapped] = addr
            }
          }
          setUserAddresses(wallets)
        }
      } catch {}
    })()
  }, [userEmail, apiBaseUrl])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500"
      case "pending":
        return "text-yellow-500"
      case "failed":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const copyToClipboard = (address: string, chain: string) => {
    navigator.clipboard.writeText(address)
    toast({
      title: "Address Copied",
      description: `${chainNames[chain as keyof typeof chainNames]} address copied to clipboard`,
    })
  }

  const handleCreateRequest = async () => {
    if (!requestAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in the amount",
        variant: "destructive",
      })
      return
    }
    try {
      setRequestSaving(true)
      
      // Generate the payment ID first
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const makeId = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let out = ""
        for (let i = 0; i < 10; i++) {
          out += chars[Math.floor(Math.random() * chars.length)]
        }
        return out
      }
      let randomId = makeId()
      const isValidId = (id: string) => /[A-Za-z]/.test(id) && /[0-9]/.test(id)
      let guard = 0
      while (!isValidId(randomId) && guard < 5) {
        randomId = makeId()
        guard++
      }

      // Send the generated payid to the backend
      await createMonomaRequest(apiBaseUrl, {
        payid: randomId,
        email: userEmail || "user@example.com",
        smartwallets: userAddresses,
        amount: Number(requestAmount),
        descriptions: requestDescription || undefined,
      })

      const url = `${origin}/pay/${randomId}`
      setRequestCreatedUrl(url)

      // Reset form
      setRequestAmount("")
      setRequestChain("")
      setRequestDescription("")
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message || "Could not create request", variant: "destructive" })
    } finally {
      setRequestSaving(false)
    }
  }

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    })
    try {
      localStorage.removeItem("monomaEmail")
    } catch {}
    try {
      const google = (window as unknown as { google?: any }).google
      if (google?.accounts?.id) {
        google.accounts.id.disableAutoSelect()
        if (userEmail) {
          google.accounts.id.revoke(userEmail, () => {})
        }
      }
    } catch {}
    router.push("/signup")
  }

  return (
    <div className="relative min-h-screen w-full">
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>

      <div className="relative z-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8"
          >
            <div className="flex items-center space-x-3 md:space-x-4">
              <img src="/logo.png" alt="Monoma Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome to Monoma</h1>
                <p className="text-sm md:text-base text-white/70">Manage your multi-chain wallets</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowSmartWallets(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-sm md:text-base"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Smart Wallets
              </Button>

              <div className="relative">
                <Button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 text-sm md:text-base"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>

                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50"
                  >
                    <div className="p-4 border-b border-white/20">
                      <p className="text-sm text-white/70">Signed in as</p>
                      <p className="text-white font-medium">{userEmail}</p>
                    </div>
                    <div className="p-2">
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full justify-start text-white hover:bg-white/10"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <Button
              onClick={() => setShowCreateRequest(true)}
              className="bg-[#CFFF04] text-black hover:bg-[#E0E722] font-semibold px-8 py-3 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Payment Request
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 md:mb-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Payment Request History</h2>

            <div className="grid grid-cols-1 gap-4">
              {paymentHistory.map((request) => (
                <Card key={request.id} className="bg-white/5 border-white/20 backdrop-blur-sm">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={chainIcons[request.chain as keyof typeof chainIcons] || "/placeholder.svg"}
                          alt={chainNames[request.chain as keyof typeof chainNames]}
                          className="w-8 h-8 md:w-10 md:h-10"
                        />
                        <div>
                          <p className="text-white font-semibold text-sm md:text-base">{request.description}</p>
                          <p className="text-white/60 text-xs md:text-sm">From: {request.from}</p>
                          <p className="text-white/60 text-xs md:text-sm">{request.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-4">
                        <div className="text-right">
                          <p className="text-white font-bold text-lg md:text-xl">{request.amount}</p>
                          <p className="text-white/60 text-xs md:text-sm">
                            {chainNames[request.chain as keyof typeof chainNames]}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span
                            className={`text-xs md:text-sm font-medium capitalize ${getStatusColor(request.status)}`}
                          >
                            {request.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {showCreateRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateRequest(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-900 border border-white/20 rounded-xl p-4 md:p-6 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                {!requestCreatedUrl ? (
                  <>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Create Payment Request</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-white/70 mb-2 block">Amount</label>
                        <Input
                          placeholder="0.00"
                          value={requestAmount}
                          onChange={(e) => setRequestAmount(e.target.value)}
                          className="bg-white/5 border border-white/20 text-white placeholder:text-white/40 text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-white/70 mb-2 block">Description (Optional)</label>
                        <Input
                          placeholder="Payment for..."
                          value={requestDescription}
                          onChange={(e) => setRequestDescription(e.target.value)}
                          className="bg-white/5 border border-white/20 text-white placeholder:text-white/40 text-sm md:text-base"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-4 md:mt-6">
                      <Button
                        onClick={() => setShowCreateRequest(false)}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10 text-sm md:text-base"
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={requestSaving}
                        onClick={handleCreateRequest}
                        className="flex-1 bg-[#CFFF04] text-black hover:bg-[#E0E722] font-semibold text-sm md:text-base disabled:opacity-60"
                      >
                        <Send className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        {requestSaving ? "Saving..." : "Create Request"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center mb-4">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white text-center">Request Created Successfully</h2>
                    <p className="text-white/80 text-sm md:text-base text-center mt-2">Share this link with the payer:</p>
                    <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between gap-3">
                      <span className="text-white/90 text-xs md:text-sm truncate">{requestCreatedUrl}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          navigator.clipboard.writeText(requestCreatedUrl)
                          toast({ title: "Copied", description: "Payment link copied to clipboard" })
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex justify-center mt-6">
                      <Button
                        className="bg-[#CFFF04] text-black hover:bg-[#E0E722] font-semibold"
                        onClick={() => {
                          setShowCreateRequest(false)
                          setRequestCreatedUrl("")
                          setRequestAmount("")
                          setRequestDescription("")
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}

          {showSmartWallets && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSmartWallets(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-900 border border-white/20 rounded-xl p-4 md:p-6 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Smart Wallets</h2>

                <div className="space-y-3">
                  {userChains
                    .filter((chain) => !!userAddresses[chain])
                    .map((chain) => {
                      const address = userAddresses[chain]
                      return (
                        <div
                          key={chain}
                          className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <img
                            src={chainIcons[chain as keyof typeof chainIcons] || "/placeholder.svg"}
                            alt={chainNames[chain as keyof typeof chainNames]}
                            className="w-6 h-6 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm">{chainNames[chain as keyof typeof chainNames]}</p>
                            <p className="text-white/60 text-xs font-mono truncate">{address}</p>
                          </div>
                          <Button
                            onClick={() => copyToClipboard(address, chain)}
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/10 p-2"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}
                </div>

                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => setShowSmartWallets(false)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {(showProfileDropdown || showSmartWallets) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileDropdown(false)
            setShowSmartWallets(false)
          }}
        />
      )}
    </div>
  )
}
