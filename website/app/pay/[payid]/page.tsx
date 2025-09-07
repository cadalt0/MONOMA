"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import { Wallet, Shield, Clock, CheckCircle, Copy, ExternalLink } from "lucide-react"
import { fetchMonomaRequest } from "@/lib/requests"

const chainMeta: Record<string, { name: string; symbol: string; iconUrl: string }> = {
  eth: { name: "Ethereum", symbol: "ETH", iconUrl: "https://cdn-icons-png.flaticon.com/128/14446/14446160.png" },
  avax: { name: "Avalanche", symbol: "AVAX", iconUrl: "https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/avalanche.png" },
  base: { name: "Base", symbol: "ETH", iconUrl: "https://avatars.githubusercontent.com/u/108554348?s=280&v=4" },
  sol: { name: "Solana", symbol: "SOL", iconUrl: "https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/solana.png" },
}

const supportedChains = [
  { id: "ethereum", name: "Ethereum", symbol: "ETH", icon: "⟠", color: "bg-blue-500" },
  { id: "avalanche", name: "Avalanche", symbol: "AVAX", icon: "🔺", color: "bg-red-500" },
  { id: "base", name: "Base", symbol: "ETH", icon: "🔵", color: "bg-blue-600" },
  { id: "solana", name: "Solana", symbol: "SOL", icon: "◎", color: "bg-purple-500" },
  { id: "polygon", name: "Polygon", symbol: "MATIC", icon: "⬟", color: "bg-purple-600" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ETH", icon: "🔷", color: "bg-blue-400" },
]

export default function PaymentPage() {
  const params = useParams()
  const payid = params.payid as string
  const [selectedChain, setSelectedChain] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [request, setRequest] = useState<{
    amount: string
    descriptions: string | null
    smartwallets: Record<string, string>
  } | null>(null)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API || ""
  const [currentChainIdHex, setCurrentChainIdHex] = useState<string>("")
  const [currentChainIdDec, setCurrentChainIdDec] = useState<number | null>(null)
  const [wrongNetwork, setWrongNetwork] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const getChainConfig = (key: string): { chainIdHex: string; chainIdDec: number; addParams: any; usdcAddress: string; explorerUrl: string } | null => {
    switch (key) {
      case "eth":
        return {
          chainIdHex: "0xaa36a7", // 11155111 Sepolia
          chainIdDec: 11155111,
          usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
          explorerUrl: "https://sepolia.etherscan.io",
          addParams: {
            chainId: "0xaa36a7",
            chainName: "Sepolia Test Network",
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        }
      case "base":
        return {
          chainIdHex: "0x14a33", // 84532 Base Sepolia
          chainIdDec: 84532,
          usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          explorerUrl: "https://sepolia.basescan.org",
          addParams: {
            chainId: "0x14a33",
            chainName: "Base Sepolia Testnet",
            nativeCurrency: { name: "Base ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://sepolia.base.org"],
            blockExplorerUrls: ["https://sepolia.basescan.org"],
          },
        }
      case "avax":
        return {
          chainIdHex: "0xa869", // 43113 Avalanche Fuji
          chainIdDec: 43113,
          usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
          explorerUrl: "https://testnet.snowtrace.io",
          addParams: {
            chainId: "0xa869",
            chainName: "Avalanche Fuji Testnet",
            nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
            rpcUrls: ["https://avalanche-fuji.drpc.org"],
            blockExplorerUrls: ["https://testnet.snowtrace.io"],
          },
        }
      default:
        return null
    }
  }

  // Removed auto switch; we'll only check and warn

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError("")
      try {
        const rec = await fetchMonomaRequest(apiBaseUrl, payid)
        if (!rec) {
          setError("Payment not found")
        } else {
          setRequest({ amount: rec.amount, descriptions: rec.descriptions ?? null, smartwallets: rec.smartwallets })
          // Preselect first available chain
          const firstChain = Object.keys(rec.smartwallets)[0] || ""
          setSelectedChain(firstChain)
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load payment")
      } finally {
        setLoading(false)
      }
    })()
  }, [apiBaseUrl, payid])

  // Auto-clear transient errors after a short delay
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(""), 4000)
    return () => clearTimeout(t)
  }, [error])

  useEffect(() => {}, [])

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      const eth = (window as unknown as { ethereum?: any }).ethereum
      if (!eth) {
        setError("MetaMask not detected. Please install MetaMask.")
        setIsConnecting(false)
        return
      }
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
      const account = accounts && accounts[0]
      if (!account) {
        setError("No account returned from wallet.")
        setIsConnecting(false)
        return
      }
      setWalletAddress(account)
      setIsConnected(true)
      try {
        const chainId: string = await eth.request({ method: "eth_chainId" })
        setCurrentChainIdHex(chainId)
        const dec = parseInt(chainId, 16)
        setCurrentChainIdDec(Number.isFinite(dec) ? dec : null)
        const expected = selectedChain ? getChainConfig(selectedChain)?.chainIdDec : undefined
        setWrongNetwork(Boolean(expected && dec !== expected))
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }
  // Poll chainId every 3s and warn if wrong network; stop when matches
  useEffect(() => {
    const eth = (window as unknown as { ethereum?: any }).ethereum
    if (!isConnected || !selectedChain || !eth) return
    const expectedDec = getChainConfig(selectedChain)?.chainIdDec

    const onChainChanged = (hexId: string) => {
      setCurrentChainIdHex(hexId)
      const dec = parseInt(hexId, 16)
      setCurrentChainIdDec(Number.isFinite(dec) ? dec : null)
      if (typeof expectedDec === "number") setWrongNetwork(dec !== expectedDec)
    }
    try {
      eth.on?.("chainChanged", onChainChanged)
    } catch {}
    let timer: any = null
    const tick = async () => {
      try {
        const chainId: string = await eth.request({ method: "eth_chainId" })
        setCurrentChainIdHex(chainId)
        const dec = parseInt(chainId, 16)
        setCurrentChainIdDec(Number.isFinite(dec) ? dec : null)
        const wrong = typeof expectedDec === "number" ? dec !== expectedDec : false
        setWrongNetwork(wrong)
        if (!wrong) return // stop polling when correct
      } catch {}
      timer = setTimeout(tick, 3000)
    }
    tick()
    return () => {
      if (timer) clearTimeout(timer)
      try {
        eth.removeListener?.("chainChanged", onChainChanged)
      } catch {}
    }
  }, [isConnected, selectedChain])

  const handlePayment = async () => {
    if (!selectedChain || !isConnected || !request) return

    const eth = (window as any).ethereum
    if (!eth) {
      setError("MetaMask not found")
      return
    }

    const chainConfig = getChainConfig(selectedChain)
    if (!chainConfig) {
      setError("Invalid chain configuration")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      // Check if user is on the correct network
      const currentChainId = await eth.request({ method: "eth_chainId" })
      if (parseInt(currentChainId, 16) !== chainConfig.chainIdDec) {
        setError("Please switch to the correct network first")
        setIsProcessing(false)
        return
      }

      // Get recipient address from the request
      const recipientAddress = request.smartwallets[selectedChain]
      if (!recipientAddress) {
        setError("Recipient address not found")
        setIsProcessing(false)
        return
      }

      // Convert amount to wei (USDC has 6 decimals)
      const amount = parseFloat(request.amount)
      const amountInWei = (amount * 1e6).toString()

      // ERC20 transfer function signature: transfer(address,uint256)
      // This sends USDC from user's wallet to recipientAddress (user's wallet from DB)
      const transferData = "0xa9059cbb" + 
        recipientAddress.slice(2).padStart(64, "0") + 
        BigInt(amountInWei).toString(16).padStart(64, "0")

      // Get appropriate gas limit for each chain
      let gasLimit: string
      switch (selectedChain) {
        case "eth":
          gasLimit = "0x186A0" // 100,000 gas for Ethereum Sepolia
          break
        case "base":
          gasLimit = "0x186A0" // 100,000 gas for Base Sepolia
          break
        case "avax":
          gasLimit = "0x186A0" // 100,000 gas for Avalanche Fuji
          break
        default:
          gasLimit = "0x186A0" // 100,000 gas default
      }

      // Try to estimate gas first, but use fallback if it fails
      try {
        const estimatedGas = await eth.request({
          method: "eth_estimateGas",
          params: [{
            from: walletAddress,
            to: chainConfig.usdcAddress,
            data: transferData,
          }]
        })
        // Add 20% buffer to estimated gas and ensure it's an integer
        const estimatedGasInt = parseInt(estimatedGas, 16)
        const bufferedGas = Math.ceil(estimatedGasInt * 1.2)
        gasLimit = "0x" + bufferedGas.toString(16)
      } catch (e) {
        // If estimation fails, use the predefined gas limit
        console.log("Gas estimation failed, using predefined limit:", gasLimit)
      }

      // Send transaction
      const txHash = await eth.request({
        method: "eth_sendTransaction",
        params: [{
          from: walletAddress,
          to: chainConfig.usdcAddress,
          data: transferData,
          gas: gasLimit,
        }]
      })

      setTxHash(txHash)
      setPaymentStatus("processing")

      // Wait for transaction confirmation
      let receipt = null
      let attempts = 0
      const maxAttempts = 30 // 30 attempts * 2 seconds = 1 minute timeout

      while (!receipt && attempts < maxAttempts) {
        try {
          receipt = await eth.request({
            method: "eth_getTransactionReceipt",
            params: [txHash]
          })
          if (receipt) break
        } catch (e) {
          // Transaction not yet mined
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
        attempts++
      }

      if (receipt && receipt.status === "0x1") {
        setPaymentStatus("success")
        
        // Wait 3 seconds before calling burn API
        console.log("Payment confirmed, waiting 3 seconds before burn...")
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Call burn USDC API after 3-second delay
        try {
          // Map chain names for API
          const apiChainName = selectedChain === "avax" ? "avalanche" : selectedChain
          
          console.log("Calling burn USDC API...")
          const burnResponse = await fetch(`${apiBaseUrl}/api/burn-usdc/${apiChainName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              walletAddress: recipientAddress,
              amount: amountInWei
            })
          })
          
          if (!burnResponse.ok) {
            console.error("Burn USDC API failed:", await burnResponse.text())
          } else {
            console.log("Burn USDC API called successfully")
          }
        } catch (burnError) {
          console.error("Error calling burn USDC API:", burnError)
        }
        
        // Show confirmed state after burn API call
        setIsConfirmed(true)
      } else {
        setError("Transaction failed or timed out")
        setPaymentStatus("idle")
      }

    } catch (error: any) {
      console.error("Payment error:", error)
      setError(error.message || "Payment failed")
      setPaymentStatus("idle")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen w-full">
        <div className="absolute inset-0 z-0">
          <ShaderAnimation />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Do not hard-stop on error; keep rendering UI and show notification instead


  // Show success state when payment is confirmed
  if (paymentStatus === "success" && isConfirmed) {
    return (
      <div className="relative min-h-screen w-full">
        <div className="absolute inset-0 z-0">
          <ShaderAnimation />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">Payment Confirmed!</h1>
                <p className="text-white/70 mb-6">
                  Your payment of {request?.amount ?? "—"} USDC has been processed successfully.
                </p>
                {txHash && (
                  <div className="bg-white/5 border border-white/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-white/70 mb-2">Transaction Hash</p>
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/20">
                      <span className="text-xs font-mono text-white/90 truncate flex-1">{txHash}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => navigator.clipboard.writeText(txHash)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          const chainConfig = getChainConfig(selectedChain)
                          if (chainConfig) {
                            window.open(`${chainConfig.explorerUrl}/tx/${txHash}`, '_blank')
                          }
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
                <Button
                  onClick={() => window.close()}
                  className="w-full bg-[#CFFF04] text-black hover:bg-[#E0E722] font-semibold"
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full">
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <img src="/logo.png" alt="Monoma Logo" className="w-12 h-12 object-contain mx-auto mb-4" />
          </motion.div>

          {/* Payment Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                {/* Amount Display */}
                <p className="text-xs text-white/50 mt-2">Reference ID: <span className="font-mono text-white/80">{payid}</span></p>
                <div className="text-center">
                  
                  <p className="text-sm text-white/70 mb-2">You are paying</p>
                  <div className="text-4xl font-bold text-white mb-2">
                    {request?.amount ?? "—"} USDC
                  </div>
                  {request?.descriptions && <p className="text-sm text-white/70">{request.descriptions}</p>}
                </div>

                {/* Chain Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Select Payment Chain</label>
                  <Select value={selectedChain} onValueChange={setSelectedChain}>
                    <SelectTrigger className="w-full bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Choose blockchain network">
                        {selectedChain && (
                          <div className="flex items-center gap-2">
                            <img src={chainMeta[selectedChain]?.iconUrl || "/placeholder.svg"} alt={selectedChain} className="w-4 h-4" />
                            <span className="text-white/90 text-sm">{chainMeta[selectedChain]?.name || selectedChain.toUpperCase()}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {Object.keys(request?.smartwallets || {}).map((c) => {
                        const meta = chainMeta[c] || { name: c.toUpperCase(), symbol: c.toUpperCase(), iconUrl: "/placeholder.svg" }
                        return (
                          <SelectItem key={c} value={c} className="text-white hover:bg-white/10">
                            <div className="flex items-center gap-3">
                              <img src={meta.iconUrl} alt={meta.name} className="w-5 h-5" />
                              <span>{meta.name}</span>
                              <Badge variant="secondary" className="ml-auto bg-white/10 text-white">{meta.symbol}</Badge>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedChain && (request?.smartwallets || {})[selectedChain] && (
                    <div className="mt-3 p-3 bg-white/5 border border-white/20 rounded-lg">
                      <p className="text-xs text-white/70 mb-1">Recipient address ({chainMeta[selectedChain]?.symbol || selectedChain.toUpperCase()})</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/90 text-xs md:text-sm font-mono truncate">{(request?.smartwallets || {})[selectedChain]}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => navigator.clipboard.writeText((request?.smartwallets || {})[selectedChain])}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallet Connection */}
                <div className="space-y-3">
                  {!isConnected ? (
                    <Button
                      onClick={handleConnectWallet}
                      disabled={isConnecting || !selectedChain}
                      className="w-full h-12 text-base bg-[#CFFF04] text-black hover:bg-[#E0E722] font-semibold"
                      size="lg"
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {wrongNetwork && (
                        <div className="p-3 rounded-lg border border-yellow-400/30 bg-yellow-500/10 text-yellow-300 text-sm">
                          Wrong network detected. Please switch to {chainMeta[selectedChain]?.name || selectedChain.toUpperCase()}.
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 bg-green-500/20 rounded-lg border border-green-400/30">
                        <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-400">Wallet Connected</p>
                          <div className="flex items-center gap-2">
                            <img src={chainMeta[selectedChain]?.iconUrl || "/placeholder.svg"} alt={selectedChain} className="w-4 h-4" />
                            <Badge variant="secondary" className="bg-white/10 text-white">{chainMeta[selectedChain]?.symbol || selectedChain.toUpperCase()}</Badge>
                            <p className="text-xs text-green-300 font-mono">
                              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handlePayment}
                        disabled={isProcessing || wrongNetwork}
                        className="w-full h-12 text-base bg-[#CFFF04] text-black hover:bg-[#E0E722] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <Clock className="w-5 h-5 mr-2 animate-spin" />
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5 mr-2" />
                            Pay {request?.amount ?? "—"} USDC
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Security Notice */}
                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#CFFF04] mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Secure Payment</p>
                      <p className="text-xs text-white/70">
                        Your transaction is secured by blockchain technology. Always verify the recipient address before
                        confirming.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center text-xs text-white/70"
          >
            <p>Powered by Monoma • Secure • Decentralized</p>
          </motion.div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          <div className="px-4 py-3 bg-red-600/90 text-white text-sm rounded-lg shadow-lg border border-white/10 max-w-md text-center">
            {error}
          </div>
        </div>
      )}
    </div>
  )
}
