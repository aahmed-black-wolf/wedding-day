# Scroll-Scrubbed Anime Animation — Design

**Date:** 2026-06-18
**Site:** Next.js 14 (App Router) + Tailwind + framer-motion + react-three-fiber. Arabic wedding site for نيمو & ديبو (18 July 2026).

## Goal

Take a WhatsApp video that has been split into 106 PNG frames (1024×576), convert
the frames to an anime style, add them to the site, and play them as a
scroll-driven, interactive frame-by-frame animation (scroll down advances the
animation; scroll up reverses it).

## Source material

- `~/Downloads/WhatsApp_Video_2026-06-18_at_2_21_37_PM_frames.zip`
- 106 PNG frames, 1024×576, RGBA, ~600 KB each (~64 MB total).
- Source frame numbering has gaps (`frame_001`, `frame_003`, `frame_005`, …);
  must be sorted and re-indexed to a contiguous sequence.

## Decisions (locked)

- **Anime conversion:** local AnimeGAN model (free, private — frames never leave
  the machine). No cloud API.
- **Placement / behavior:** new **pinned full-screen section** that sticks while
  scrolling, with frames scrubbing in proportion to scroll progress
  (Apple-style cinematic reveal).

## Architecture

### 1. Offline conversion pipeline — `tools/anime/` (git-ignored)

One-time, run locally; only the output WebP frames are committed.

1. Unzip the 106 frames to a temp working dir; sort and **re-index sequentially**
   (`frame_001 … frame_106`).
2. `uv` creates an isolated **Python 3.12** env with `torch`, `torchvision`,
   `Pillow` (system Python is 3.14, too new for ML wheels — uv handles 3.12).
3. **AnimeGANv2** via `torch.hub` with pretrained weights. Use a scene style
   (`paprika` / Hayao) by default; `face_paint_512_v2` if the video is mostly
   faces. Preview one frame in candidate styles and pick before batch-running.
   Runs on Apple Silicon `mps` if available, else CPU.
4. Web-optimize: resize to **960 px wide**, encode **WebP q≈80**, sequential
   names → `public/anime/frame_0001.webp … frame_0106.webp`. Expected
   ~40–70 KB/frame, ~5–7 MB total.

### 2. Scroll-scrub component — `components/AnimeScroll.js`

- `"use client"`. Renders a tall spacer section (~`300vh`) containing a `sticky`
  full-screen `<canvas>`.
- On mount, preloads all frames into `Image` objects with a lightweight loading
  state (progress while images decode).
- `useScroll` (framer-motion, already a dependency) maps section scroll progress
  (0→1) to frame index (0→105); draws the current frame to canvas with a
  cover-fit `drawImage`, throttled via `requestAnimationFrame`.
- Bi-directional scrub (down advances, up reverses).
- Overlay caption in Arabic matching the site theme (`font-display`, `wine`,
  `gold`), fading with scroll.
- Respects `prefers-reduced-motion`: shows a single static frame instead of
  scrubbing.

### 3. Page wiring — `app/page.js`

Import `AnimeScroll` and place it **immediately after `<Story />`** ("our story
begins here" → the animated story plays).

## Out of scope (YAGNI)

- No new runtime dependencies (reuse framer-motion + canvas).
- No cloud/API calls.
- No changes to the 3D Experience, Hero, Countdown, Guests, or the Redis guest
  API.

## Trade-offs

- Committing ~5–7 MB of WebP frames is the cost of a smooth scrubber — acceptable
  for a wedding site.
- Chose canvas frame-sequence over scrubbing a real `<video>` `currentTime`,
  which is lighter but janky on mobile Safari.
