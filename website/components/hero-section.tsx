"use client"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InfiniteSlider } from "@/components/ui/infinite-slider"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"
import { Menu, X } from "lucide-react"

export function HeroSection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C67F2] via-[#4D6A92] to-[#62CFF4] relative overflow-hidden">
      <HeroHeader />
      <main className="flex items-center justify-center min-h-screen pt-16">
        <section className="w-full">
          <div className="relative mx-auto flex max-w-6xl flex-col px-6 lg:block">
            <div className="mx-auto max-w-lg text-center lg:ml-0 lg:w-1/2 lg:text-left">
              <h1 className="mt-8 max-w-2xl text-balance text-5xl font-medium md:text-6xl lg:mt-16 xl:text-7xl text-[#CFFF04]">
                Settle USDC 10x Faster
              </h1>
              <p className="mt-8 max-w-2xl text-pretty text-lg text-white/90">
                Bridge and settle USDC seamlessly across 12+ chains to Arbitrum. Fast, secure, and cost-effective
                cross-chain settlements.
              </p>

              <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="px-5 text-base bg-[#CFFF04] text-black hover:bg-[#E0E722] font-semibold"
                >
                  <Link href="#link">
                    <span className="text-nowrap">Launch App</span>
                  </Link>
                </Button>
                <Button
                  key={2}
                  asChild
                  size="lg"
                  variant="ghost"
                  className="px-5 text-base text-white hover:bg-white/10 border border-white/20"
                >
                  <Link href="#link">
                    <span className="text-nowrap">View Documentation</span>
                  </Link>
                </Button>
              </div>
            </div>
            <img
              className="pointer-events-none order-first ml-auto h-56 w-full object-cover opacity-20 sm:h-96 lg:absolute lg:inset-0 lg:-right-20 lg:-top-96 lg:order-last lg:h-max lg:w-2/3 lg:object-contain"
              src="/abstract-blockchain-network-visualization-with-glo.jpg"
              alt="Blockchain Network"
              height="400"
              width="600"
            />
          </div>
        </section>
      </main>

      <section className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm pb-8 pt-8">
        <div className="group relative m-auto max-w-6xl px-6">
          <div className="flex flex-col items-center md:flex-row">
            <div className="md:max-w-44 md:border-r md:border-white/20 md:pr-6">
              <p className="text-end text-sm text-white/70">Supported Networks</p>
            </div>
            <div className="relative py-6 md:w-[calc(100%-11rem)]">
              <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                <div className="flex items-center">
                  <img 
                    src="https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/avalanche.png" 
                    alt="Avalanche" 
                    className="w-4 h-4 mr-2 object-contain"
                  />
                  <span className="text-white font-medium">Avalanche</span>
                </div>
                <div className="flex items-center">
                  <img 
                    src="https://avatars.githubusercontent.com/u/108554348?s=280&v=4" 
                    alt="Base" 
                    className="w-4 h-4 mr-2 object-contain"
                  />
                  <span className="text-white font-medium">Base</span>
                </div>
                <div className="flex items-center">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/128/14446/14446160.png" 
                    alt="Ethereum" 
                    className="w-4 h-4 mr-2 object-contain"
                  />
                  <span className="text-white font-medium">Ethereum</span>
                </div>
                <div className="flex items-center">
                  <img 
                    src="https://moralis.com/wp-content/uploads/2024/04/Linea-Chain-Icon.svg" 
                    alt="Linea" 
                    className="w-4 h-4 mr-2 object-contain"
                  />
                  <span className="text-white font-medium">Linea</span>
                </div>
                <div className="flex items-center">
                  <img 
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqidBq62tBzMjwxpb9WljM3BuKe6oEHzbJ6Q&s" 
                    alt="Optimism" 
                    className="w-4 h-4 mr-2 object-contain"
                  />
                  <span className="text-white font-medium">OP Mainnet</span>
                </div>
                <div className="flex items-center">
                  <img 
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-UjZYpTKlVQWhKF3Sf3camP-rCTZ_OZnqcA&s" 
                    alt="Polygon" 
                    className="w-4 h-4 mr-2 object-contain"
                  />
                  <span className="text-white font-medium">Polygon</span>
                </div>
                <div className="flex items-center">
                  <img 
                    src="https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/solana.png" 
                    alt="Solana" 
                    className="w-4 h-4 mr-2 object-contain"
                  />
                  <span className="text-white font-medium">Solana</span>
                </div>
                <div className="flex items-center">
                  <img 
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIOk2BmIfo12hx0k8FiNNC9MJgop2AAEIoFg&s" 
                    alt="Unichain" 
                    className="w-4 h-4 mr-2 object-contain"
                  />
                  <span className="text-white font-medium">Unichain</span>
                </div>
              </InfiniteSlider>

              <ProgressiveBlur
                className="pointer-events-none absolute left-0 top-0 h-full w-20"
                direction="left"
                blurIntensity={1}
              />
              <ProgressiveBlur
                className="pointer-events-none absolute right-0 top-0 h-full w-20"
                direction="right"
                blurIntensity={1}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const menuItems = [
  { name: "Features", href: "#features" },
  { name: "Networks", href: "#networks" },
  { name: "Docs", href: "#docs" },
  { name: "About", href: "#about" },
]

const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false)
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <nav data-state={menuState && "active"} className="group bg-black/10 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 transition-all duration-300">
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
              <Link href="/" aria-label="home" className="flex items-center space-x-2">
                <MonomaLogo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200 text-white" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 text-white" />
              </button>

              <div className="hidden lg:block">
                <ul className="flex gap-8 text-sm">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link href={item.href} className="text-white/70 hover:text-[#CFFF04] block duration-150">
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-black/20 group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link href={item.href} className="text-white/70 hover:text-[#CFFF04] block duration-150">
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <Link href="#">
                    <span>Connect Wallet</span>
                  </Link>
                </Button>
                <Button asChild size="sm" className="bg-[#CFFF04] text-black hover:bg-[#E0E722]">
                  <Link href="#">
                    <span>Launch App</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

const MonomaLogo = ({ className }: { className?: string }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-[#CFFF04] rounded-lg flex items-center justify-center">
        <span className="text-black font-bold text-lg">M</span>
      </div>
      <span className="text-white font-bold text-xl">Monoma</span>
    </div>
  )
}
