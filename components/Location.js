"use client";

import { motion } from "framer-motion";

export default function Location() {
  return (
    <section className="section text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="font-display text-3xl text-wine sm:text-4xl"
      >
        مكان الفرح
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative mx-auto mt-8 aspect-[16/10] w-full max-w-2xl overflow-hidden rounded-3xl border border-gold/30 shadow-xl"
      >
        {/* Faux map background (blurred placeholder until the real link is ready) */}
        <div className="absolute inset-0 bg-[#e8e5dc]" aria-hidden>
          {/* roads */}
          <div className="absolute left-0 top-1/3 h-2 w-full -rotate-6 bg-white/70" />
          <div className="absolute left-0 top-2/3 h-3 w-full rotate-3 bg-white/80" />
          <div className="absolute left-1/4 top-0 h-full w-2 rotate-6 bg-white/70" />
          <div className="absolute left-2/3 top-0 h-full w-3 -rotate-3 bg-white/60" />
          {/* greens / blocks */}
          <div className="absolute left-6 top-6 h-20 w-24 rounded-lg bg-[#cdd9b5]/80" />
          <div className="absolute bottom-8 right-10 h-24 w-28 rounded-lg bg-[#cdd9b5]/70" />
          <div className="absolute bottom-6 left-1/3 h-16 w-20 rounded-lg bg-[#d8d2c2]" />
          {/* water */}
          <div className="absolute -right-6 top-4 h-28 w-40 rotate-12 rounded-full bg-[#bcd4e6]/80" />
        </div>

        {/* blur + dim overlay */}
        <div className="absolute inset-0 backdrop-blur-[3px] bg-wine/15" />

        {/* coming soon overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.span
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl drop-shadow"
          >
            📍
          </motion.span>
          <p className="mt-3 rounded-full bg-cream/90 px-5 py-2 font-display text-xl text-wine shadow">
            قريباً
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream drop-shadow sm:text-base">
            هنوافيكم بموقع الفرح على الخريطة قبل الفرح بـ ١٠ أيام بإذن الله
          </p>
          <span className="mt-3 text-xs tracking-widest text-cream/90 drop-shadow">
            ٨ يوليو ٢٠٢٦
          </span>
        </div>
      </motion.div>
    </section>
  );
}
