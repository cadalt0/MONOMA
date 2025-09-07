"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* 404 Number */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <h1 className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#CFFF04] to-[#00D4FF] leading-none">
              404
            </h1>
            <div className="absolute inset-0 text-9xl md:text-[12rem] font-black text-[#CFFF04]/20 blur-sm">
              404
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Page Not Found
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <button
              onClick={() => router.back()}
              className="px-8 py-3 bg-transparent border-2 border-[#CFFF04] text-[#CFFF04] rounded-lg font-semibold hover:bg-[#CFFF04] hover:text-black transition-all duration-300 transform hover:scale-105"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-8 py-3 bg-[#CFFF04] text-black rounded-lg font-semibold hover:bg-[#CFFF04]/80 transition-all duration-300 transform hover:scale-105"
            >
              Go Home
            </button>
          </motion.div>

          {/* Floating Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="absolute inset-0 pointer-events-none"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-20 left-10 w-4 h-4 bg-[#CFFF04] rounded-full opacity-60"
            />
            <motion.div
              animate={{
                y: [0, 15, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute top-40 right-20 w-3 h-3 bg-[#00D4FF] rounded-full opacity-60"
            />
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 3, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
              className="absolute bottom-40 left-20 w-2 h-2 bg-[#CFFF04] rounded-full opacity-40"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
