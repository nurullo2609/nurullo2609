// Admin statistikasi. Parol bilan himoyalangan (ADMIN_PAROL env).
// Netlify Blobs'dan hodisalarni o'qib, jamlangan hisobot qaytaradi.
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const parol = url.searchParams.get("parol") || req.headers.get("x-parol") || "";
  const kerakli = process.env.ADMIN_PAROL;

  if (!kerakli) return jsonResp({ error: "ADMIN_PAROL sozlanmagan (Netlify env)" }, 500);
  if (parol !== kerakli) return jsonResp({ error: "Parol xato" }, 401);

  let events = [];
  try {
    const store = getStore("analytics");
    const res = await store.list({ prefix: "ev:" });
    let keys = (res.blobs || []).map((b) => b.key).sort();
    // Ko'p bo'lsa faqat oxirgi 3000 tasini olamiz (tezlik uchun)
    if (keys.length > 3000) keys = keys.slice(keys.length - 3000);
    for (const k of keys) {
      try {
        const v = await store.get(k, { type: "json" });
        if (v) events.push(v);
      } catch (e) {}
    }
  } catch (e) {
    return jsonResp({ error: "Blobs o'qilmadi: " + (e && e.message ? e.message : "") }, 500);
  }

  events.sort((a, b) => b.t - a.t);

  const byNisha = {};
  const bySegment = {};
  const byDavlat = {};
  const byRejim = {};
  const kunlik = {};
  const sessiyalar = new Set();

  for (const e of events) {
    if (e.nisha) byNisha[e.nisha] = (byNisha[e.nisha] || 0) + 1;
    if (e.segment) bySegment[e.segment] = (bySegment[e.segment] || 0) + 1;
    if (e.rejim) byRejim[e.rejim] = (byRejim[e.rejim] || 0) + 1;
    const d = e.davlat || "Noma'lum";
    byDavlat[d] = (byDavlat[d] || 0) + 1;
    if (e.sid) sessiyalar.add(e.sid);
    const kun = new Date(e.t).toISOString().slice(0, 10);
    kunlik[kun] = (kunlik[kun] || 0) + 1;
  }

  return jsonResp({
    jami: events.length,
    sessiyalar: sessiyalar.size,
    byNisha,
    bySegment,
    byDavlat,
    byRejim,
    kunlik,
    oxirgi: events.slice(0, 60),
  });
};

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
