import type React from "react"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import { FloatingNav } from "@/components/ui/floating-navbar"
import { GooeyText } from "@/components/ui/gooey-text-morphing"
import { WorldMap } from "@/components/ui/map"

export default function MonomaLanding() {
  const navItems: { name: string; link: string; icon?: React.ReactElement }[] = []

  const chains = [
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

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <FloatingNav
        navItems={navItems}
        className="bg-black/60 backdrop-blur-md border border-[#CFFF04]/30 shadow-lg shadow-[#CFFF04]/10"
      />

      <div className="hidden md:block">
        <ShaderAnimation />
      </div>

      {/* Full screen map background - hidden on mobile */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <WorldMap
          dots={[
            {
              start: { lat: 40.7128, lng: -74.0060, label: "Ethereum" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: 35.6762, lng: 139.6503, label: "Solana" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: 1.3521, lng: 103.8198, label: "Polygon PoS" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: -33.8688, lng: 151.2093, label: "Linea" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: 22.3193, lng: 114.1694, label: "Sonic" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: -23.5505, lng: -46.6333, label: "World Chain" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: 51.5074, lng: -0.1278, label: "Base" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: 37.7749, lng: -122.4194, label: "Avalanche" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: 52.5200, lng: 13.4050, label: "OP Mainnet" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: 25.2048, lng: 55.2708, label: "Sei" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: 55.7558, lng: 37.6176, label: "Unichain" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
            {
              start: { lat: 19.4326, lng: -99.1332, label: "Codex" },
              end: { lat: 0, lng: 0, label: "Arbitrum" },
            },
          ]}
          lineColor="#CFFF04"
          showLabels={true}
          animationDuration={2}
          loop={true}
        />
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-8 lg:px-16 py-8">
        <div className="w-full max-w-7xl flex items-center justify-center md:justify-between">
          {/* Main content - centered on mobile, left-aligned on desktop */}
          <div className="flex-1 max-w-2xl space-y-4 lg:space-y-6 text-center md:text-left">
          <h1
            className="text-3xl sm:text-5xl lg:text-7xl leading-tight font-light tracking-wide"
            style={{ color: "#CFFF04" }}
          >
            <span className="block font-bold animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <span className="font-thin">Settle</span> Stablecoins
            </span>
            <span className="block font-thin animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              From Everywhere
            </span>
            <div className="flex items-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <span className="font-thin mr-3">to</span>
              <span className="font-bold mr-3">Arbitrum</span>
              <img 
                src="https://cdn3d.iconscout.com/3d/premium/thumb/arbitrum-arb-3d-icon-png-download-11757502.png" 
                alt="Arbitrum" 
                className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 object-contain animate-bounce-in"
                style={{ animationDelay: '0.8s' }}
              />
            </div>
          </h1>
          <div className="space-y-2 lg:space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight animate-fade-in-up" style={{ animationDelay: '1s' }}>
            Non custodial
            </h2>
            <p className="text-lg sm:text-xl text-white/80 animate-fade-in-up flex items-center whitespace-nowrap" style={{ animationDelay: '1.2s' }}>
              12+ chain support • 
              <GooeyText
                texts={[
                  "Lightning fast settlement",
                  "Gasless transactions", 
                  "Instant transfers",
                  "Secure & decentralized",
                  "Low fees",
                  "Cross-chain bridge"
                ]}
                morphTime={2}
                cooldownTime={1}
                className="ml-4 inline-block"
                textClassName="text-lg sm:text-xl text-white/80 font-normal leading-normal"
              />
            </p>
          </div>
        </div>

          {/* Right side - Empty space for map connections - hidden on mobile */}
          <div className="hidden md:flex flex-1 justify-center items-center relative z-20">
            <div className="text-white/40 text-lg">
              {/* Map connections flow here */}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Launch dApp button - positioned above footer */}
      <div className="absolute bottom-20 left-0 right-0 z-10 flex justify-center md:hidden">
        <a href="/signup" className="px-10 py-4 bg-[#CFFF04] text-black rounded-xl font-bold text-lg hover:bg-[#CFFF04]/80 transition-all duration-300 transform hover:scale-105 shadow-xl">
          Launch dApp
        </a>
      </div>

      <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 z-10 overflow-hidden bg-gradient-to-r from-transparent via-black/20 to-transparent backdrop-blur-sm border-t border-[#CFFF04]/20">
        <div className="flex animate-scroll whitespace-nowrap py-3 sm:py-4">
          {/* Duplicate chains for seamless loop */}
          {[...chains, ...chains, ...chains].map((chain, index) => (
            <span
              key={`${chain}-${index}`}
              className="inline-flex items-center mx-6 sm:mx-8 text-white/60 text-xs sm:text-sm font-medium"
            >
              {chain === "Ethereum" && (
                <img 
                  src="https://cdn-icons-png.flaticon.com/128/14446/14446160.png" 
                  alt="Ethereum" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain === "Avalanche" && (
                <img 
                  src="https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/avalanche.png" 
                  alt="Avalanche" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain === "Base" && (
                <img 
                  src="https://avatars.githubusercontent.com/u/108554348?s=280&v=4" 
                  alt="Base" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain === "Linea" && (
                <img 
                  src="https://moralis.com/wp-content/uploads/2024/04/Linea-Chain-Icon.svg" 
                  alt="Linea" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain === "OP Mainnet" && (
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqidBq62tBzMjwxpb9WljM3BuKe6oEHzbJ6Q&s" 
                  alt="Optimism" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain === "Polygon PoS" && (
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-UjZYpTKlVQWhKF3Sf3camP-rCTZ_OZnqcA&s" 
                  alt="Polygon" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain === "Sei" && (
                <img 
                  src="https://tw.mitrade.com/cms_uploads/img/20230816/9fa1c5943c8af63ea49970c8697e986c.jpg" 
                  alt="Sei" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain === "Solana" && (
                <img 
                  src="https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/solana.png" 
                  alt="Solana" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain === "Sonic" && (
                <img 
                  src="https://s2.coinmarketcap.com/static/img/coins/200x200/32684.png" 
                  alt="Sonic" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain === "Unichain" && (
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIOk2BmIfo12hx0k8FiNNC9MJgop2AAEIoFg&s" 
                  alt="Unichain" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain === "World Chain" && (
                <img 
                  src="https://static1.tokenterminal.com//worldchain/logo.png?logo_hash=786762db10d4891532210e063b6501ac6ad715a9" 
                  alt="World Chain" 
                  className="w-4 h-4 mr-2 object-contain"
                />
              )}
              {chain}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
