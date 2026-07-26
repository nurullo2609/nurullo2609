// Netlify Function — Anthropic API proksisi.
// API kaliti FAQAT shu yerda (server tomonda) yashaydi, frontendga chiqmaydi.
// Frontend "/api/claude" ga murojaat qiladi (netlify.toml dagi redirect orqali).

exports.handler = async (event) => {
  // Faqat POST
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Faqat POST so'rov qabul qilinadi." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(500, {
      error: "Server sozlanmagan: ANTHROPIC_API_KEY topilmadi. Netlify > Site settings > Environment variables ga qo'shing.",
    });
  }

  // Model env orqali sozlanadi. Standart: claude-sonnet-4-6.
  // Yangi/arzonroq variant uchun CLAUDE_MODEL=claude-sonnet-5 qo'ying.
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "Noto'g'ri so'rov formati." });
  }

  const { system, messages, max_tokens } = payload;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json(400, { error: "Xabarlar bo'sh." });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(Number(max_tokens) || 1000, 1500),
        system,
        messages,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const detail = data && data.error && data.error.message ? data.error.message : "Anthropic API xatosi.";
      return json(res.status, { error: detail });
    }
    return json(200, data);
  } catch (e) {
    return json(502, { error: "Serverga ulanishda muammo. Qaytadan urinib ko'ring." });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
