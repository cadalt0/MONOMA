"use client"
import { FloatingNav } from "@/components/ui/floating-navbar"

export function MonomaHeader() {
  const navItems = [
    {
      name: "MONOMA",
      link: "/",
    },
  ]

  return (
    <div className="relative w-full">
      <FloatingNav navItems={navItems} className="bg-black/20 backdrop-blur-md border-[#CFFF04]/20" />
    </div>
  )
}
