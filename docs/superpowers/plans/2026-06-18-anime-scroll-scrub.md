# Scroll-Scrubbed Anime Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert 106 video frames to anime style locally, then play them as a scroll-scrubbed full-screen animation on the wedding site.

**Architecture:** A one-time offline Python pipeline (run via `uv`, isolated Python 3.12) converts the zipped PNG frames with AnimeGANv2 and writes web-optimized WebP frames to `public/anime/`. A new client React component (`AnimeScroll`) preloads those frames and draws the scroll-mapped frame to a `sticky` full-screen `<canvas>`, wired into `app/page.js` after `<Story />`.

**Tech Stack:** Next.js 14 (App Router), React 18, framer-motion (already a dep), Tailwind, HTML5 canvas. Offline: `uv` + Python 3.12 + PyTorch + torchvision + Pillow + AnimeGANv2 (`bryandlee/animegan2-pytorch` via `torch.hub`).

## Global Constraints

- No new runtime npm dependencies — reuse `framer-motion` + canvas only.
- No cloud/API calls; conversion is fully local. Frames never leave the machine.
- Do not modify `Experience`, `Hero`, `Countdown`, `Guests`, or `app/api/guests/route.js`.
- Output frames: 960 px wide, WebP q≈80, contiguous names `public/anime/frame_0001.webp … frame_0106.webp`.
- Source zip: `~/Downloads/WhatsApp_Video_2026-06-18_at_2_21_37_PM_frames.zip` (106 PNGs, gapped numbering, 1024×576).
- This repo has **no JS test framework**. "Verify" steps use real commands available here: `npm run build`, `npm run lint`, and asset/file checks. Do not scaffold jest/vitest (YAGNI).
- The `tools/anime/` scripts are dev-only and git-ignored; only the produced WebP frames are committed.

---

### Task 1: Conversion pipeline scaffold + extract & re-index frames

Creates the offline tooling dir, ignores it, and produces a clean contiguously-numbered set of source PNGs in a working dir.

**Files:**
- Create: `tools/anime/extract.py`
- Modify: `.gitignore`

**Interfaces:**
- Produces: working dir `tools/anime/work/frames_src/frame_001.png … frame_106.png` (contiguous), used by Task 2.

- [ ] **Step 1: Ignore the dev tooling working artifacts**

Add to `.gitignore` (after the `/build` line):

```
# Anime conversion tooling — dev only, not committed (output WebP frames in public/ ARE committed)
/tools/anime/work
/tools/anime/.venv
__pycache__/
```

- [ ] **Step 2: Write the extract+reindex script**

Create `tools/anime/extract.py`:

```python
# /// script
# requires-python = "==3.12.*"
# dependencies = ["Pillow>=10.4"]
# ///
"""Unzip the WhatsApp frames and re-index them to a contiguous sequence.

The source zip numbers frames with gaps (frame_001, frame_003, ...). We sort by
the numeric suffix and rename to frame_001..frame_NNN with no gaps.
"""
import re
import sys
import zipfile
from pathlib import Path

ZIP = Path.home() / "Downloads" / "WhatsApp_Video_2026-06-18_at_2_21_37_PM_frames.zip"
OUT = Path(__file__).parent / "work" / "frames_src"


def main() -> int:
    if not ZIP.exists():
        print(f"ERROR: zip not found: {ZIP}", file=sys.stderr)
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    for p in OUT.glob("*.png"):
        p.unlink()

    with zipfile.ZipFile(ZIP) as zf:
        names = [n for n in zf.namelist() if n.lower().endswith(".png")]

        def key(n: str) -> int:
            m = re.search(r"frame_(\d+)\.png$", n)
            return int(m.group(1)) if m else 0

        names.sort(key=key)
        for i, name in enumerate(names, start=1):
            data = zf.read(name)
            dest = OUT / f"frame_{i:03d}.png"
            dest.write_bytes(data)

    count = len(list(OUT.glob("*.png")))
    print(f"Extracted {count} frames -> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 3: Run it**

Run: `uv run tools/anime/extract.py`
Expected: prints `Extracted 106 frames -> .../tools/anime/work/frames_src` and exits 0.

- [ ] **Step 4: Verify the output**

Run: `ls tools/anime/work/frames_src | head -3; ls tools/anime/work/frames_src | tail -1; ls tools/anime/work/frames_src | wc -l`
Expected: lists `frame_001.png frame_002.png frame_003.png`, last is `frame_106.png`, count `106`.

- [ ] **Step 5: Commit**

```bash
git add .gitignore tools/anime/extract.py
git commit -m "feat(anime): add frame extract+reindex pipeline step"
```

---

### Task 2: AnimeGAN conversion + web-optimize to public/anime

Converts the re-indexed PNGs to anime style and writes optimized WebP frames. Includes a style-preview step so the best AnimeGANv2 weight is chosen before the full batch.

**Files:**
- Create: `tools/anime/convert.py`
- Create (output, committed): `public/anime/frame_0001.webp … frame_0106.webp`

**Interfaces:**
- Consumes: `tools/anime/work/frames_src/frame_001.png … frame_106.png` (Task 1).
- Produces: `public/anime/frame_0001.webp … frame_0106.webp` (960 px wide), consumed by Tasks 3–4. Frame count (106) is what `AnimeScroll` hardcodes as `FRAME_COUNT`.

- [ ] **Step 1: Write the conversion script**

Create `tools/anime/convert.py`:

```python
# /// script
# requires-python = "==3.12.*"
# dependencies = ["torch>=2.2", "torchvision>=0.17", "Pillow>=10.4", "numpy>=1.26"]
# ///
"""Convert re-indexed frames to anime style with AnimeGANv2, then web-optimize.

Usage:
  uv run tools/anime/convert.py --preview            # render frame_001 in all styles
  uv run tools/anime/convert.py --style paprika      # full batch -> public/anime
"""
import argparse
import sys
from pathlib import Path

import torch
from PIL import Image

SRC = Path(__file__).parent / "work" / "frames_src"
PREVIEW_DIR = Path(__file__).parent / "work" / "preview"
OUT = Path(__file__).resolve().parents[2] / "public" / "anime"
STYLES = ["paprika", "celeba_distill", "face_paint_512_v2"]
OUT_WIDTH = 960
WEBP_QUALITY = 80


def device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def load_model(style: str, dev: torch.device):
    return torch.hub.load(
        "bryandlee/animegan2-pytorch:main", "generator",
        pretrained=style, device=dev, progress=True,
    ).eval()


def to_tensor(img: Image.Image, dev: torch.device) -> torch.Tensor:
    import numpy as np
    arr = np.asarray(img.convert("RGB"), dtype="float32") / 127.5 - 1.0
    t = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)
    return t.to(dev)


def to_image(t: torch.Tensor) -> Image.Image:
    import numpy as np
    out = t.squeeze(0).permute(1, 2, 0).clamp(-1, 1).cpu().numpy()
    out = ((out + 1.0) * 127.5).astype("uint8")
    return Image.fromarray(out, "RGB")


@torch.no_grad()
def stylize(model, img: Image.Image, dev: torch.device) -> Image.Image:
    return to_image(model(to_tensor(img, dev)))


def web_optimize(img: Image.Image) -> Image.Image:
    w, h = img.size
    nh = round(h * OUT_WIDTH / w)
    return img.resize((OUT_WIDTH, nh), Image.LANCZOS)


def preview(dev: torch.device) -> int:
    src = SRC / "frame_001.png"
    if not src.exists():
        print("ERROR: run extract.py first (frame_001.png missing)", file=sys.stderr)
        return 1
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.open(src)
    for style in STYLES:
        model = load_model(style, dev)
        out = web_optimize(stylize(model, img, dev))
        dest = PREVIEW_DIR / f"preview_{style}.webp"
        out.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
        print(f"  wrote {dest}")
    print(f"Previews in {PREVIEW_DIR} — open them and pick a --style.")
    return 0


def batch(style: str, dev: torch.device) -> int:
    frames = sorted(SRC.glob("frame_*.png"))
    if not frames:
        print("ERROR: no source frames (run extract.py)", file=sys.stderr)
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    for p in OUT.glob("*.webp"):
        p.unlink()
    model = load_model(style, dev)
    for i, p in enumerate(frames, start=1):
        out = web_optimize(stylize(model, Image.open(p), dev))
        dest = OUT / f"frame_{i:04d}.webp"
        out.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
        if i % 10 == 0 or i == len(frames):
            print(f"  {i}/{len(frames)}")
    print(f"Wrote {len(frames)} frames -> {OUT}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--style", choices=STYLES, default="paprika")
    args = ap.parse_args()
    dev = device()
    print(f"device: {dev}")
    return preview(dev) if args.preview else batch(args.style, dev)


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Render style previews**

Run: `uv run tools/anime/convert.py --preview`
Expected: downloads weights on first run, prints `device: ...`, writes `preview_paprika.webp`, `preview_celeba_distill.webp`, `preview_face_paint_512_v2.webp` into `tools/anime/work/preview/`.

- [ ] **Step 3: Pick the style**

Open the three preview files. Choose the best look for this video (default `paprika` for scenes; `face_paint_512_v2` if it is mostly close-up faces). Note the chosen style for Step 4. If the engineer cannot judge, surface the three previews to the user and ask.

- [ ] **Step 4: Run the full batch with the chosen style**

Run: `uv run tools/anime/convert.py --style <chosen>`
Expected: prints progress `10/106 … 106/106` and `Wrote 106 frames -> .../public/anime`.

- [ ] **Step 5: Verify output frames**

Run: `ls public/anime | head -2; ls public/anime | tail -1; ls public/anime | wc -l; du -sh public/anime`
Expected: `frame_0001.webp frame_0002.webp` … `frame_0106.webp`, count `106`, total size roughly 4–8 MB.

- [ ] **Step 6: Commit**

```bash
git add tools/anime/convert.py public/anime
git commit -m "feat(anime): convert frames to anime style and add optimized webp frames"
```

---

### Task 3: AnimeScroll scroll-scrub component

Builds the client component that preloads frames and scrubs them on a sticky full-screen canvas.

**Files:**
- Create: `components/AnimeScroll.js`

**Interfaces:**
- Consumes: `public/anime/frame_0001.webp … frame_0106.webp` (Task 2) via `/anime/frame_%04d.webp` paths; `FRAME_COUNT = 106`.
- Produces: default export `AnimeScroll` (no props), imported by Task 4.

- [ ] **Step 1: Write the component**

Create `components/AnimeScroll.js`:

```jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, motion, useTransform } from "framer-motion";

const FRAME_COUNT = 106;
const framePath = (i) =>
  `/anime/frame_${String(i + 1).padStart(4, "0")}.webp`;

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

  // Draw a given frame index, cover-fit, on a DPR-aware canvas.
  const draw = (index) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    const scale = Math.max((cw * dpr) / img.naturalWidth, (ch * dpr) / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (cw * dpr - dw) / 2;
    const dy = (ch * dpr - dh) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, dx, dy, dw, dh);
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
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
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
          <p className="font-display text-3xl text-cream drop-shadow-lg sm:text-5xl">
            قصة حب
          </p>
          <p className="mt-2 text-cream/80">نيمو &amp; ديبو</p>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Confirm theme tokens exist**

Run: `grep -E "cream|wine|gold|font-display|\.section" tailwind.config.js app/globals.css`
Expected: `cream`, `wine`, `gold` colors and `font-display` / `.section` are defined (they are used elsewhere). If `cream` is absent, substitute an existing light color token found in `tailwind.config.js`.

- [ ] **Step 3: Lint the new file**

Run: `npm run lint`
Expected: no errors for `components/AnimeScroll.js` (warnings tolerated).

- [ ] **Step 4: Commit**

```bash
git add components/AnimeScroll.js
git commit -m "feat(anime): add scroll-scrub canvas component"
```

---

### Task 4: Wire AnimeScroll into the page and verify the build

Mounts the component after `<Story />` and confirms the whole site still builds.

**Files:**
- Modify: `app/page.js`

**Interfaces:**
- Consumes: default export `AnimeScroll` (Task 3).

- [ ] **Step 1: Import and place the component**

In `app/page.js`, add the import alongside the others:

```jsx
import AnimeScroll from "@/components/AnimeScroll";
```

And insert it immediately after `<Story />` in the JSX:

```jsx
      <Story />
      <AnimeScroll />
      <BrideGroom />
```

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build completes with no errors; route `/` compiles.

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev` then open `http://localhost:3000`. Scroll to the section after "قصتنا تبدأ هنا".
Expected: loading percentage appears, then the anime frames scrub as you scroll down and reverse as you scroll up; the «قصة حب» caption fades in/out. Stop the dev server when done.

- [ ] **Step 4: Commit**

```bash
git add app/page.js
git commit -m "feat(anime): mount scroll-scrub animation after Story section"
```

---

## Self-Review

**Spec coverage:**
- Anime conversion (local AnimeGAN) → Task 2. ✓
- Frame extract + re-index (gapped numbering) → Task 1. ✓
- Web-optimize (960px WebP q80, contiguous names) → Task 2 (`web_optimize`, naming). ✓
- Pinned full-screen scroll-scrub, bi-directional → Task 3 (`h-[300vh]` + `sticky`, `scrollYProgress`). ✓
- Preload + loading state → Task 3 (`loaded`/`ready`). ✓
- prefers-reduced-motion static frame → Task 3. ✓
- Themed Arabic caption → Task 3. ✓
- Placement after `<Story />` → Task 4. ✓
- git-ignore dev tooling, commit only output frames → Task 1 (.gitignore), Task 2 (commits `public/anime`). ✓
- No new npm deps / no cloud / untouched components → respected across tasks. ✓

**Placeholder scan:** No TBD/TODO; all code blocks complete; style choice in Task 2 Step 3 is a real decision step with concrete fallback, not a placeholder.

**Type consistency:** `FRAME_COUNT = 106` consistent (Task 2 output count ↔ Task 3 constant). `framePath` uses `frame_%04d.webp` matching Task 2's `frame_{i:04d}.webp`. Output dir `public/anime` consistent across Tasks 2–4. `AnimeScroll` default export consistent (Task 3 → Task 4).
