"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchGuests, addGuest, subscribeGuests } from "@/lib/guests";

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [paused, setPaused] = useState(false);

  // Initial load + realtime subscription
  useEffect(() => {
    let active = true;
    fetchGuests()
      .then((list) => active && setGuests(list))
      .catch(() => {});

    const unsub = subscribeGuests((row) => {
      setGuests((prev) =>
        prev.some((g) => g.id === row.id) ? prev : [row, ...prev]
      );
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    setStatus("loading");
    try {
      const record = await addGuest(clean);
      setGuests((prev) =>
        prev.some((g) => g.id === record.id) ? prev : [record, ...prev]
      );
      setName("");
      setStatus("success");
      setMessage(`شكراً ${record.name}! تم تأكيد حضورك 💖`);
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setStatus("error");
      setMessage(err?.message || "حدث خطأ، حاول مرة أخرى");
    }
  }

  // Only auto-scroll once there are enough names to fill the panel; otherwise
  // show a clean static list so short lists don't look janky.
  const shouldAnimate = guests.length > 6;
  const duration = Math.max(20, guests.length * 2.6);

  return (
    <section id="rsvp" className="section">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-2">
        {/* RSVP form */}
        <div className="text-center lg:text-right">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-display text-3xl text-wine sm:text-4xl"
          >
            أكّد حضورك
          </motion.h2>
          <p className="mt-4 text-ink/70">
            سيسعدنا وجودك معنا في هذا اليوم. اكتب اسمك لتأكيد الحضور.
          </p>

          <form onSubmit={handleSubmit} className="glass mt-8 rounded-3xl p-6">
            <label className="block text-right text-sm text-ink/70">الاسم</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك هنا"
              className="mt-2 w-full rounded-xl border border-gold/40 bg-white/70 px-4 py-3 text-lg text-ink outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/40"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-4 w-full rounded-xl bg-wine px-6 py-3 text-lg font-semibold text-cream shadow-lg transition hover:bg-rose disabled:opacity-60"
            >
              {status === "loading" ? "...جارٍ التأكيد" : "سأحضر 💍"}
            </button>

            <AnimatePresence>
              {status === "success" && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-green-700"
                >
                  {message}
                </motion.p>
              )}
              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-red-700"
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Animated scrolling guest list */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-wine/10 px-5 py-2">
            <span className="font-display text-xl text-wine sm:text-2xl">
              قائمة الحضور
            </span>
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-wine px-2 text-sm font-semibold text-cream">
              {guests.length}
            </span>
          </div>

          <div
            className="marquee-mask glass relative mt-6 h-[26rem] overflow-hidden rounded-[2rem] p-4"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {guests.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-ink/50">
                <span className="text-5xl">💐</span>
                <span>كن أول من يؤكد الحضور</span>
              </div>
            ) : shouldAnimate ? (
              <div
                className={`marquee-track flex flex-col ${
                  paused ? "marquee-paused" : ""
                }`}
                style={{ "--duration": `${duration}s` }}
              >
                <GuestGroup guests={guests} />
                <GuestGroup guests={guests} ariaHidden />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {guests.map((g, i) => (
                  <GuestRow key={g.id} guest={g} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const AVATAR_GRADIENTS = [
  "from-rose to-wine",
  "from-gold to-wine",
  "from-rose to-gold",
  "from-wine to-rose",
];

function initial(name) {
  const t = String(name || "").trim();
  return t ? Array.from(t)[0] : "♥";
}

function GuestRow({ guest, index }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-gradient-to-l from-white/80 to-blush/30 px-4 py-3 shadow-sm">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${
          AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
        } font-display text-lg text-cream shadow`}
      >
        {initial(guest.name)}
      </span>
      <span className="flex-1 truncate text-right text-lg text-ink">
        {guest.name}
      </span>
      <span className="text-lg text-rose">💖</span>
    </div>
  );
}

function GuestGroup({ guests, ariaHidden = false }) {
  // pb-3 matches the inner gap so the two stacked groups tile seamlessly.
  return (
    <div className="flex flex-col gap-3 pb-3" aria-hidden={ariaHidden}>
      {guests.map((g, i) => (
        <GuestRow key={g.id} guest={g} index={i} />
      ))}
    </div>
  );
}
