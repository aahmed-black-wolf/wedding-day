"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function BrideGroom() {
  const ref = useRef(null);
  // Track scroll progress across this tall section.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // RTL: groom is fixed on the right, bride travels from far left to meet him.
  // Bride moves rightward (toward groom) as you scroll: -38vw -> -2vw.
  const brideX = useTransform(scrollYProgress, [0.1, 0.6], ["-36vw", "-2vw"]);
  const brideOpacity = useTransform(scrollYProgress, [0.05, 0.2], [0, 1]);
  const groomX = useTransform(scrollYProgress, [0.1, 0.6], ["36vw", "2vw"]);
  const groomOpacity = useTransform(scrollYProgress, [0.05, 0.2], [0, 1]);

  // The heart between them blooms once they are close.
  const heartScale = useTransform(scrollYProgress, [0.55, 0.72], [0, 1]);
  const heartOpacity = useTransform(scrollYProgress, [0.55, 0.7], [0, 1]);
  const captionOpacity = useTransform(scrollYProgress, [0.6, 0.78], [0, 1]);
  const captionY = useTransform(scrollYProgress, [0.6, 0.78], [20, 0]);

  // Gentle walking bob.
  const bob = { y: [0, -10, 0] };

  return (
    <section ref={ref} className="relative h-[220vh] w-full">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <h2 className="absolute top-16 px-6 text-center font-display text-2xl text-wine sm:text-3xl">
          كل خطوة تقرّبنا من بعض
        </h2>

        <div className="relative flex w-full items-center justify-center">
          {/* Bride */}
          <motion.div
            style={{ x: brideX, opacity: brideOpacity }}
            className="absolute"
          >
            <motion.div
              animate={bob}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl sm:text-8xl"
            >
              👰‍♀️
            </motion.div>
            <p className="mt-2 text-center font-display text-lg text-wine">
              نرمين
            </p>
            <p className="text-center text-xs text-ink/50">العروسة</p>
          </motion.div>

          {/* Heart that blooms when they meet */}
          <motion.div
            style={{ scale: heartScale, opacity: heartOpacity }}
            className="text-5xl sm:text-6xl"
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="inline-block"
            >
              ❤️
            </motion.span>
          </motion.div>

          {/* Groom */}
          <motion.div
            style={{ x: groomX, opacity: groomOpacity }}
            className="absolute"
          >
            <motion.div
              animate={bob}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
              className="text-7xl sm:text-8xl"
            >
              🤵‍♂️
            </motion.div>
            <p className="mt-2 text-center font-display text-lg text-wine">
              عبد الرحمن
            </p>
            <p className="text-center text-xs text-ink/50">العريس</p>
          </motion.div>
        </div>

        <motion.p
          style={{ opacity: captionOpacity, y: captionY }}
          className="absolute bottom-24 px-6 text-center font-display text-2xl text-wine sm:text-3xl"
        >
          والآن.. إلى الأبد معاً 💍
        </motion.p>
      </div>
    </section>
  );
}
