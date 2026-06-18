"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, motion, useTransform } from "framer-motion";

const FRAME_COUNT = 15;
const framePath = (i) =>
  `/anime/frame_${String(i + 1).padStart(3, "0")}.png`;

export default function AnimeScroll() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const captionOpacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.85, 1],
    [0, 1, 1, 0]
  );

  // Preload all frames.
  useEffect(() => {
    let cancelled = false;
    let count = 0;
    const imgs = new Array(FRAME_COUNT);
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = img.onerror = () => {
        if (cancelled) return;
        count += 1;
        setLoaded(count);
        if (count === FRAME_COUNT) setReady(true);
      };
      imgs[i] = img;
    }
    imagesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, []);

  // Draw frame `index` on a DPR-aware canvas. The frames are white-paper pencil
  // sketches, so we fill the canvas with the same paper tone and draw the whole
  // frame contain-fit (no crop) on top — the letterbox area blends seamlessly
  // into the sketch's white background, like one continuous drawing on paper.
  const draw = (index) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const w = cw * dpr;
    const h = ch * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Paper backdrop fills the letterbox area to match the sketch's white ground.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // The footage was filmed in portrait but the frames are stored sideways
    // (landscape). Rotate landscape frames 90° clockwise so the drawing stands
    // upright. Fit is computed against the post-rotation (swapped) dimensions.
    const rotate = iw > ih;
    const fitW = rotate ? ih : iw;
    const fitH = rotate ? iw : ih;
    const fitScale = Math.min(w / fitW, h / fitH);
    const dw = iw * fitScale;
    const dh = ih * fitScale;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (rotate) ctx.rotate(Math.PI / 2); // flip to -Math.PI/2 if upside down
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  };

  // Scrub frames with scroll (rAF-throttled). Reduced motion -> static frame.
  useEffect(() => {
    if (!ready) return;
    if (reducedMotion) {
      draw(Math.floor(FRAME_COUNT / 2));
      return;
    }
    let raf = 0;
    const render = (p) => {
      const idx = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(p * (FRAME_COUNT - 1)))
      );
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => draw(idx));
    };
    render(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", render);
    const onResize = () => render(scrollYProgress.get());
    window.addEventListener("resize", onResize);
    return () => {
      unsub();
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [ready, reducedMotion, scrollYProgress]);

  return (
    <section ref={sectionRef} className="relative h-[300vh] w-full">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        <canvas ref={canvasRef} className="block h-full w-full" />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream text-wine">
            <p className="font-display text-xl">
              ‫جاري التحميل… {Math.round((loaded / FRAME_COUNT) * 100)}٪
            </p>
          </div>
        )}

        <motion.div
          style={{ opacity: reducedMotion ? 1 : captionOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-16 text-center"
        >
          <p className="font-display text-3xl text-wine drop-shadow-sm sm:text-5xl">
            قصة حب
          </p>
          <p className="mt-2 text-wine/70">عبد الرحمن &amp; نرمين</p>
        </motion.div>
      </div>
    </section>
  );
}
