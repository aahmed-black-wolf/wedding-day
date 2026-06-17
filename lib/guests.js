// Client-side data layer. All reads/writes go through the server-side API
// route (/api/guests), which persists names to data/guests.json. No database
// keys are ever exposed to the browser.

const API = "/api/guests";

/** Fetch all guests, newest first. */
export async function fetchGuests() {
  const res = await fetch(API, { cache: "no-store" });
  if (!res.ok) throw new Error("تعذّر تحميل القائمة");
  const data = await res.json();
  return data.guests || [];
}

/** Add a guest by name. Returns the created record. */
export async function addGuest(name) {
  const clean = String(name || "").trim();
  if (!clean) throw new Error("الاسم مطلوب");

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: clean }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "حدث خطأ، حاول مرة أخرى");
  return data.guest;
}

/**
 * Poll the server for newly added guests (the file store has no realtime
 * channel). Calls onInsert(record) for each new guest. Returns an unsubscribe
 * function.
 */
export function subscribeGuests(onInsert) {
  let active = true;
  let primed = false;
  const seen = new Set();

  async function poll() {
    if (!active) return;
    try {
      const list = await fetchGuests();
      if (!primed) {
        list.forEach((g) => seen.add(g.id));
        primed = true;
        return;
      }
      // Surface any ids we haven't seen yet (oldest first for natural order).
      for (let i = list.length - 1; i >= 0; i--) {
        const g = list[i];
        if (!seen.has(g.id)) {
          seen.add(g.id);
          onInsert(g);
        }
      }
    } catch {
      // network blip — try again next tick
    }
  }

  const interval = setInterval(poll, 5000);
  return () => {
    active = false;
    clearInterval(interval);
  };
}
