// Landing formasidan lidni qabul qiladi:
//  1) Telegram botingiz orqali SIZGA xabar yuboradi
//  2) Netlify Blobs'ga saqlaydi (admin panelда ham ko'rinadi)
// Env kerak: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
import { getStore } from "@netlify/blobs";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export default async (req, context) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: CORS });
  if (req.method !== "POST") return jsonResp({ error: "POST kerak" }, 405);

  let body = {};
  try {
    body = await req.json();
  } catch (e) {}

  const ism = String(body.ism || "").slice(0, 80);
  const telefon = String(body.telefon || "").slice(0, 40);
  const biznes = String(body.biznes || "").slice(0, 60);
  if (!ism && !telefon) return jsonResp({ error: "Ism yoki telefon kerak" }, 400);

  const geo = (context && context.geo) || {};
  const joy = [geo.city, geo.country && geo.country.name].filter(Boolean).join(", ");

  // 1) Blobs'ga saqlash (analitika bilan bir do'konда)
  try {
    const store = getStore("analytics");
    const rec = {
      t: Date.now(),
      event: "lead",
      nisha: biznes,
      segment: biznes && ["B2B", "B2C", "B2G"].includes(biznes) ? biznes : "",
      rejim: "",
      sid: "",
      davlat: (geo.country && geo.country.name) || "",
      shahar: geo.city || "",
      ism,
      telefon,
    };
    await store.setJSON("ev:" + rec.t + ":" + Math.random().toString(36).slice(2, 8), rec);
  } catch (e) {}

  // Telegram'ga xabar. chat_id: env yo'q bo'lsa, quyidagi guruh ishlatiladi.
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || "-4388640584";
  if (token && chatId) {
    const text =
      "🆕 Yangi lid — Sotuv Trenajyori\n" +
      "👤 Ism: " + (ism || "—") + "\n" +
      "📞 Telefon: " + (telefon || "—") + "\n" +
      "🏢 Biznes: " + (biznes || "—") + "\n" +
      "📍 Joy: " + (joy || "—");
    try {
      await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (e) {}
  }

  return jsonResp({ ok: true });
};

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}
