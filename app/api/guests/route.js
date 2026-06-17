import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Always run on the server, never cache the list.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "guests.json");

// Serialize writes so concurrent RSVPs can't clobber the file.
let writeChain = Promise.resolve();

async function readGuests() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return []; // file not created yet
  }
}

async function writeGuests(list) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
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
  const list = await readGuests();
  list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return NextResponse.json({ guests: list });
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

  // Queue this write behind any in-flight write, but keep the chain alive
  // even if one write fails.
  const task = writeChain.then(async () => {
    const list = await readGuests();
    const record = {
      id: crypto.randomUUID(),
      name,
      created_at: new Date().toISOString(),
    };
    list.push(record);
    await writeGuests(list);
    return record;
  });
  writeChain = task.catch(() => {});

  try {
    const record = await task;
    return NextResponse.json({ guest: record }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "تعذّر الحفظ، حاول مرة أخرى" },
      { status: 500 }
    );
  }
}
