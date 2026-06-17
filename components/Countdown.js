"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TARGET = new Date("2026-07-18T16:00:00+03:00").getTime();

function toArabicDigits(n) {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).replace(/\d/g, (d) => map[Number(d)]);
}

function diff() {
  const now = Date.now();
  let delta = Math.max(0, TARGET - now);
  const days = Math.floor(delta / 86400000);
  delta -= days * 86400000;
  const hours = Math.floor(delta / 3600000);
  delta -= hours * 3600000;
  const minutes = Math.floor(delta / 60000);
  delta -= minutes * 60000;
  const seconds = Math.floor(delta / 1000);
  return { days, hours, minutes, seconds };
}

function Unit({ value, label }) {
  const padded = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="glass relative flex h-20 w-20 items-center justify-center rounded-2xl sm:h-28 sm:w-28">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={padded}
            initial={{ y: -28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-display text-3xl text-wine sm:text-5xl"
          >
            {toArabicDigits(padded)}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-3 text-sm text-ink/70 sm:text-base">{label}</span>
    </div>
  );
}

export default function Countdown() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(diff());
    const id = setInterval(() => setTime(diff()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) {
    return <section className="section min-h-[200px]" />;
  }

  const done =
    time.days === 0 &&
    time.hours === 0 &&
    time.minutes === 0 &&
    time.seconds === 0;

  return (
    <section className="section text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="font-display text-3xl text-wine sm:text-4xl"
      >
        {done ? "اليوم الموعود قد حان 🎉" : "العد التنازلي لليوم الكبير"}
      </motion.h2>

      {!done && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          <Unit value={time.seconds} label="ثانية" />
          <Unit value={time.minutes} label="دقيقة" />
          <Unit value={time.hours} label="ساعة" />
          <Unit value={time.days} label="يوم" />
        </div>
      )}
    </section>
  );
}
