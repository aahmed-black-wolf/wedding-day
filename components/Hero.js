"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });

export default function Hero() {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden">
      {/* 3D layer */}
      <div className="pointer-events-none absolute inset-0">
        <Scene3D />
      </div>

      {/* soft vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/80" />

      {/* Content */}
      <div className="relative z-10 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-4 text-lg tracking-[0.3em] text-wine/80"
        >
          بسعادة غامرة ندعوكم لحضور حفل زفاف
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.5, ease: "easeOut" }}
          className="font-display text-6xl leading-tight text-wine sm:text-7xl md:text-8xl"
        >
          نيمو
          <motion.span
            initial={{ opacity: 0, rotate: -20 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mx-4 inline-block gold-text"
          >
            &amp;
          </motion.span>
          ديبو
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="mx-auto mt-6 flex max-w-md items-center justify-center gap-4"
        >
          <span className="h-px flex-1 bg-gold/50" />
          <span className="font-display text-2xl text-gold">سيتزوجان</span>
          <span className="h-px flex-1 bg-gold/50" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-6 text-2xl font-semibold text-ink sm:text-3xl"
        >
          ١٨ يوليو ٢٠٢٦
        </motion.p>
        <p className="mt-1 text-sm tracking-widest text-ink/50">2026 / 07 / 18</p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute inset-x-0 -bottom-24 flex flex-col items-center text-wine/60"
        >
          <span className="text-sm">انزل للأسفل</span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="mt-1 text-2xl"
          >
            ↓
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
}
