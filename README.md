# نيمو & ديبو — موقع زفاف متحرك 💍

Animated Arabic wedding website for **Nemmo & Depo** — **18 July 2026**.
Built with **Next.js**, **Framer Motion**, and **React Three Fiber** (3D floating
petals & hearts). Guests RSVP with their name and appear in an auto-scrolling
guest list. Names are stored **server-side in a JSON file** via a Next.js API
route — no database account and no public keys in the browser.

## Features
- 🌸 3D hero scene (floating petals + hearts) via React Three Fiber
- ⏳ Live countdown to 2026-07-18
- 💌 RSVP form that saves the guest's name (server-side)
- 📜 Auto-scrolling guest list (pauses on hover), refreshed by polling
- 🎵 Background music (Canon in D) starting on the intro tap
- 🌐 Full Arabic / RTL layout with elegant Arabic fonts

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

That's it — no setup, no keys. The first RSVP creates `data/guests.json` and
every visitor reads the same list from the server.

## How guest storage works
- The browser never talks to a database. It calls the API route
  [`app/api/guests/route.js`](./app/api/guests/route.js):
  - `GET /api/guests` → returns all names
  - `POST /api/guests` → validates + sanitizes the name and appends it
- Data is persisted to `data/guests.json` (git-ignored, kept private).
- Writes are serialized so simultaneous RSVPs can't corrupt the file.

## Deploy
Use a host that runs a **persistent Node server** and keeps a writable disk, so
the JSON file survives between requests:

- **Render / Railway / Fly.io / a VPS** (`npm run build && npm run start`) ✅
- ⚠️ **Vercel / Netlify serverless**: the filesystem is read-only / ephemeral,
  so `data/guests.json` won't persist there. If you must deploy serverless,
  swap the file read/write in `app/api/guests/route.js` for a hosted store
  (e.g. Vercel KV, Upstash Redis, or a database) — the rest of the app is
  unchanged.

## Customize
- Names / texts: `components/Hero.js`, `components/Story.js`, `app/layout.js`
- Bride & groom in the scroll scene: `components/BrideGroom.js`
- Date: `components/Countdown.js` (the `TARGET` constant) and Hero/Story text
- Colors & fonts: `tailwind.config.js`
- 3D effect: `components/Scene3D.js`
- Music: replace `public/music.mp3` with your own track
