import { NextResponse } from "next/server";
import crypto from "crypto";
import { Redis } from "@upstash/redis";

// Always run on the server, never cache the list.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Vercel's serverless filesystem is read-only (and ephemeral), so guests are
// persisted in Upstash Redis instead of a local JSON file. The Vercel/Upstash
// integration injects KV_REST_API_URL / KV_REST_API_TOKEN; fall back to the
// UPSTASH_* names used by Redis.fromEnv() for non-Vercel setups.
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});
const KEY = "guests";

async function readGuests() {
  // Stored as a list of records (newest pushed to the right).
  const raw = await redis.lrange(KEY, 0, -1);
  return raw.map((item) => (typeof item === "string" ? JSON.parse(item) : item));
}

function sanitize(name) {
  // Drop control characters, collapse whitespace, cap length.
  const cleaned = Array.from(String(name ?? ""))
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("");
  return cleaned.replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function GET() {
  try {
    const list = await readGuests();
    list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return NextResponse.json({ guests: list });
  } catch {
    return NextResponse.json({ error: "تعذّر تحميل القائمة" }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const name = sanitize(body.name);
  if (!name) {
    return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  }

  const record = {
    id: crypto.randomUUID(),
    name,
    created_at: new Date().toISOString(),
  };

  try {
    await redis.rpush(KEY, JSON.stringify(record));
    return NextResponse.json({ guest: record }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "تعذّر الحفظ، حاول مرة أخرى" },
      { status: 500 }
    );
  }
}
