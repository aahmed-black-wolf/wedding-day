"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSynthMusic } from "@/lib/synthMusic";

// Boom burst particles flung outward from the center on open.
const BURST = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2;
  const dist = 180 + (i % 5) * 60;
  return {
    id: i,
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    emoji: ["💖", "🌸", "💕", "🌹", "✨"][i % 5],
    rotate: (i % 2 ? 1 : -1) * (120 + i * 8),
    delay: (i % 6) * 0.02,
  };
});

export default function Experience() {
  const [open, setOpen] = useState(false); // invitation opened?
  const [booming, setBooming] = useState(false); // burst playing?
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);
  const synthRef = useRef(null);
  const usingSynthRef = useRef(false);

  // Lock scroll while the intro overlay is up.
  useEffect(() => {
    document.body.style.overflow = open ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Clean up the synth on unmount.
  useEffect(() => {
    return () => synthRef.current?.stop();
  }, []);

  function startSynthFallback() {
    if (!synthRef.current) synthRef.current = createSynthMusic();
    usingSynthRef.current = true;
    synthRef.current.start();
    synthRef.current.setMuted(false);
    setMuted(false);
  }

  function handleOpen() {
    setBooming(true);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.6;
      // Try the mp3 file; if it's missing/blocked, fall back to the synth.
      audio.play().then(
        () => {
          usingSynthRef.current = false;
        },
        () => startSynthFallback()
      );
    } else {
      startSynthFallback();
    }
    // Let the burst play, then lift the curtain.
    setTimeout(() => setOpen(true), 1100);
  }

  function toggleMute() {
    if (usingSynthRef.current) {
      const next = !muted;
      synthRef.current?.setMuted(next);
      setMuted(next);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => startSynthFallback());
      setMuted(false);
    } else {
      audio.muted = !audio.muted;
      setMuted(audio.muted);
    }
  }

  return (
    <>
      {/* Background music. Drop your file at public/music.mp3 */}
      <audio ref={audioRef} src="/music.mp3" loop preload="auto" />

      {/* Intro / boom overlay */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-wine via-rose to-blush text-center"
          >
            {/* Burst particles */}
            <div className="pointer-events-none absolute left-1/2 top-1/2">
              {booming &&
                BURST.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{
                      x: p.x,
                      y: p.y,
                      scale: [0, 1.4, 1],
                      opacity: [1, 1, 0],
                      rotate: p.rotate,
                    }}
                    transition={{ duration: 1, delay: p.delay, ease: "easeOut" }}
                    className="absolute text-3xl"
                  >
                    {p.emoji}
                  </motion.span>
                ))}
            </div>

            {/* Center flash on boom */}
            <AnimatePresence>
              {booming && (
                <motion.div
                  initial={{ scale: 0, opacity: 0.9 }}
                  animate={{ scale: 6, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                />
              )}
            </AnimatePresence>

            <motion.div
              animate={booming ? { scale: [1, 1.25, 0.4], opacity: [1, 1, 0] } : {}}
              transition={{ duration: 1, ease: "easeIn" }}
              className="relative z-10 px-6"
            >
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-7xl"
              >
                💌
              </motion.div>
              <h1 className="mt-6 font-display text-5xl text-cream sm:text-6xl">
                عبد الرحمن &amp; نرمين
              </h1>
              <p className="mt-3 text-cream/80">يدعوانكم لمشاركة فرحتهما</p>

              {!booming && (
                <motion.button
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpen}
                  className="mt-10 rounded-full bg-cream px-10 py-4 text-lg font-semibold text-wine shadow-xl"
                >
                  افتح الدعوة 🎉
                </motion.button>
              )}
              <p className="mt-4 text-xs text-cream/60">
                اضغط لفتح الدعوة وتشغيل الموسيقى 🎵
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating music toggle (after opening) */}
      {open && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={toggleMute}
          aria-label="تشغيل/إيقاف الموسيقى"
          className="glass fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-lg"
        >
          <motion.span
            animate={muted ? {} : { rotate: [0, 12, -12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {muted ? "🔇" : "🎵"}
          </motion.span>
        </motion.button>
      )}
    </>
  );
}
