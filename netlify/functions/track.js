// Analitika hodisasini yozadi. Geo (davlat/shahar) Netlify context'dan olinadi.
// Ma'lumot Netlify Blobs'da "analytics" do'konida saqlanadi.
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return jsonResp({ error: "POST kerak" }, 405);
  }

  let body = {};
  try {
    body = await req.json();
  } catch (e) {}

  const geo = (context && context.geo) || {};
  const rec = {
    t: Date.now(),
    event: String(body.event || "nomalum").slice(0, 40),
    nisha: String(body.nisha || "").slice(0, 140),
    segment: String(body.segment || "").slice(0, 10),
    rejim: String(body.rejim || "").slice(0, 20),
    sid: String(body.sid || "").slice(0, 40),
    davlat: (geo.country && geo.country.name) || "",
    shahar: geo.city || "",
  };

  try {
    const store = getStore("analytics");
    const key = "ev:" + rec.t + ":" + Math.random().toString(36).slice(2, 8);
    await store.setJSON(key, rec);
  } catch (e) {
    // Analitika hech qachon ilovani buzmasin
  }

  return jsonResp({ ok: true });
};

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
