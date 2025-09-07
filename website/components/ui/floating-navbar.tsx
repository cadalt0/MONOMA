"use client"
import { useState } from "react"
import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { LiquidButton } from "./liquid-glass-button"

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string
    link: string
    icon?: React.ReactElement
  }[]
  className?: string
}) => {
  const [visible] = useState(true)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: 0,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex fixed top-6 inset-x-0 mx-auto border border-transparent rounded-full z-[5000] px-6 py-3 items-center justify-center md:justify-between max-w-4xl",
          className,
        )}
      >
        <div className="flex items-center">
          <Link href="/" className="flex items-center text-[#CFFF04] font-bold text-2xl tracking-wider">
            <img 
              src="/logo.png" 
              alt="MONOMA Logo" 
              className="w-8 h-8 mr-3 object-contain"
            />
            MONOMA
          </Link>
        </div>

        <Link href="/signup" className="hidden md:block">
          <LiquidButton className="text-[#CFFF04] font-semibold text-base hover:text-[#E0E722] transition-colors" size="xl">
            Launch dApp
          </LiquidButton>
        </Link>
      </motion.div>
    </AnimatePresence>
  )
}
