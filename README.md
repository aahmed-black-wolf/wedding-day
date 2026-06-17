# نيمو & ديبو — موقع زفاف متحرك 💍

Animated Arabic wedding website for **Nemmo & Depo** — **18 July 2026**.
Built with **Next.js**, **Framer Motion**, and **React Three Fiber** (3D floating
petals & hearts). Guests RSVP with their name and appear in a live, auto-scrolling
guest list backed by **Supabase**.

## Features
- 🌸 3D hero scene (floating petals + hearts) via React Three Fiber
- ⏳ Live countdown to 2026-07-18
- 💌 RSVP form that saves the guest's name
- 📜 Infinite auto-scrolling guest list (pauses on hover), updates in realtime
- 🌐 Full Arabic / RTL layout with elegant Arabic fonts

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

> Without Supabase keys the site runs in **local demo mode**: names save to the
> visitor's own browser so you can try everything immediately.

## Enable the shared guest list (Supabase — free)

1. Create a free project at https://supabase.com.
2. In the dashboard go to **SQL Editor → New query**, paste the contents of
   [`supabase-setup.sql`](./supabase-setup.sql), and run it.
3. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.
4. Copy `.env.local.example` to `.env.local` and paste the two values:

   ```bash
   cp .env.local.example .env.local
   ```

5. Restart the dev server. Now every visitor sees the same live guest list.

## Deploy
Deploy to **Vercel** (recommended for Next.js). Add the two `NEXT_PUBLIC_…`
environment variables in the Vercel project settings.

## Customize
- Names / texts: `components/Hero.js`, `components/Story.js`, `app/layout.js`
- Date: `components/Countdown.js` (the `TARGET` constant) and Hero/Story text
- Colors & fonts: `tailwind.config.js`
- 3D effect: `components/Scene3D.js`
# wedding-day
