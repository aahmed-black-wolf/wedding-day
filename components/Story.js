"use client";

import { motion } from "framer-motion";

const items = [
  {
    icon: "📅",
    title: "التاريخ",
    text: "السبت ١٨ يوليو ٢٠٢٦",
  },
  {
    icon: "🕓",
    title: "الموعد",
    text: "الرابعة عصراً",
  },
  {
    icon: "💍",
    title: "المناسبة",
    text: "حفل زفاف عبدالرحمن ونرمين",
  },
];

export default function Story() {
  return (
    <section className="section text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="font-display text-3xl text-wine sm:text-4xl"
      >
        قصتنا تبدأ هنا
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className="mx-auto mt-5 max-w-xl text-lg leading-loose text-ink/80"
      >
        في يومٍ جميل التقت قلوبنا، واليوم نبدأ رحلة العمر معاً.
        يسعدنا أن نشارككم فرحتنا وأن تكونوا جزءاً من ذكرى لا تُنسى.
      </motion.p>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="glass rounded-3xl p-7"
          >
            <div className="text-4xl">{it.icon}</div>
            <h3 className="mt-4 font-display text-xl text-wine">{it.title}</h3>
            <p className="mt-2 text-ink/70">{it.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
