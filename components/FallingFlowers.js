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
    // Keep petals in a [12%, 88%] band, anchored by their centre below, so the
    // glyph width + sway + rotation never overflow the viewport on mobile.
    left: `${(12 + r * 76).toFixed(2)}%`,
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
      // `contain: paint` forces the browser to clip the petals — including the
      // ones promoted to their own GPU layer by will-change/animation — to this
      // box, and excludes their swaying transforms from the page's scrollable
      // area. Without it, overflow-hidden leaks composited layers on mobile and
      // the page can be panned/zoomed horizontally.
      style={{ opacity: active ? 1 : 0, contain: "paint" }}
    >
      {PETALS.map((p) => (
        <span
          key={p.id}
          // Anchor centres the petal on `left` (translateX(-50%)) so the glyph +
          // sway extend symmetrically and never overflow the viewport edge.
          className="absolute top-0 -translate-x-1/2"
          style={{ left: p.left }}
        >
          <span
            className="petal-fall block will-change-transform"
            style={{ "--fall": `${p.fall}s`, "--delay": `${p.delay}s` }}
          >
            <span
              className="petal-sway block"
              style={{
                "--sway": `${p.sway}s`,
                // Responsive: shrinks on small screens (vw), clamped to a
                // smaller floor and the original size as the ceiling.
                fontSize: `clamp(${Math.round(p.size * 0.55)}px, ${(
                  p.size * 0.19
                ).toFixed(2)}vw, ${p.size}px)`,
                opacity: p.opacity,
              }}
            >
              {p.flower}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
