"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Red arteries that branch and spread into a heart shape as you scroll.
const HEART =
  "M50 30 C50 30 45 10 25 10 C5 10 5 35 5 35 C5 55 30 75 50 90 C70 75 95 55 95 35 C95 35 95 10 75 10 C55 10 50 30 50 30 Z";

// Vascular tree: a trunk rising from the bottom point, branching into both lobes.
const ARTERIES = [
  { d: "M50 90 C50 76 49 64 50 50", w: 2.6 }, // main trunk
  { d: "M50 56 C42 52 36 47 30 40 C26 35 24 30 23 24", w: 2 }, // left main
  { d: "M50 56 C58 52 64 47 70 40 C74 35 76 30 77 24", w: 2 }, // right main
  { d: "M37 46 C33 44 28 44 22 41", w: 1.3 }, // left twig 1
  { d: "M30 40 C28 34 25 30 18 28", w: 1.3 }, // left twig 2
  { d: "M63 46 C67 44 72 44 78 41", w: 1.3 }, // right twig 1
  { d: "M70 40 C72 34 75 30 82 28", w: 1.3 }, // right twig 2
  { d: "M50 64 C46 62 43 60 39 59", w: 1.1 }, // lower left twig
  { d: "M50 64 C54 62 57 60 61 59", w: 1.1 }, // lower right twig
  { d: "M23 24 C22 20 24 17 28 15", w: 0.9 }, // capillary
  { d: "M77 24 C78 20 76 17 72 15", w: 0.9 }, // capillary
];

export default function HeartCrack() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // The whole vascular tree grows in across the scroll.
  const grow = useTransform(scrollYProgress, [0.2, 0.7], [0, 1]);
  // Heart outline traces first, then a soft red fill fades in.
  const outline = useTransform(scrollYProgress, [0.18, 0.45], [0, 1]);
  const fillOpacity = useTransform(scrollYProgress, [0.55, 0.8], [0, 0.18]);
  const scale = useTransform(scrollYProgress, [0.2, 0.5, 0.75], [0.96, 1.05, 1]);

  return (
    <section ref={ref} className="relative h-[200vh] w-full">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center">
        <motion.svg
          viewBox="0 0 100 100"
          style={{ scale }}
          className="h-56 w-56 sm:h-72 sm:w-72"
          aria-label="شرايين حمراء تكوّن قلبًا"
        >
          <defs>
            <linearGradient id="arteryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8a0a8" />
              <stop offset="100%" stopColor="#7d2b3a" />
            </linearGradient>
          </defs>

          {/* Soft red fill that blooms once the arteries are drawn */}
          <motion.path
            d={HEART}
            fill="url(#arteryFill)"
            style={{ opacity: fillOpacity }}
          />

          {/* Heart outline traces on */}
          <motion.path
            d={HEART}
            fill="none"
            stroke="#7d2b3a"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength: outline }}
          />

          {/* Branching arteries */}
          {ARTERIES.map((a, i) => (
            <motion.path
              key={i}
              d={a.d}
              fill="none"
              stroke="#b3263a"
              strokeWidth={a.w}
              strokeLinecap="round"
              style={{ pathLength: grow }}
            />
          ))}
        </motion.svg>
      </div>
    </section>
  );
}
