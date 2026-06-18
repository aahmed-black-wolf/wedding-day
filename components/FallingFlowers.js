"use client";

import { useEffect, useState } from "react";

// Deterministic pseudo-random so server and client markup match (no hydration mismatch).
function rand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const FLOWERS = ["🌸", "🌷", "🌹", "💮", "🏵️"];

const PETALS = Array.from({ length: 26 }, (_, i) => {
  const r = rand(i + 1);
  const r2 = rand(i + 31);
  const r3 = rand(i + 61);
  return {
    id: i,
    left: `${(r * 100).toFixed(2)}%`,
    fall: 9 + r2 * 9, // 9s – 18s
    sway: 3 + r3 * 3, // 3s – 6s
    delay: -(r * 18).toFixed(2), // negative so they're already mid-fall on load
    size: 16 + Math.round(r3 * 16), // 16px – 32px
    opacity: 0.55 + r2 * 0.4,
    flower: FLOWERS[i % FLOWERS.length],
  };
});

export default function FallingFlowers() {
  // Hidden over the hero (it has its own hearts); fades in once scrolled past it.
  const [active, setActive] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      // Reveal once we've scrolled ~60% past the first viewport (the hero).
      setActive(window.scrollY > window.innerHeight * 0.6);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden transition-opacity duration-700"
      style={{ opacity: active ? 1 : 0 }}
    >
      {PETALS.map((p) => (
        <span
          key={p.id}
          className="petal-fall absolute top-0 will-change-transform"
          style={{
            left: p.left,
            "--fall": `${p.fall}s`,
            "--delay": `${p.delay}s`,
          }}
        >
          <span
            className="petal-sway block"
            style={{
              "--sway": `${p.sway}s`,
              fontSize: `${p.size}px`,
              opacity: p.opacity,
            }}
          >
            {p.flower}
          </span>
        </span>
      ))}
    </div>
  );
}
