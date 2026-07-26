import React, { useState, useRef, useEffect } from "react";

/* ============================================================
   SOTUV TRENAJYORI — sotuv menejerlarini o'rgatuvchi ilova
   Chap panel: chat (foydalanuvchi = SOTUVCHI, AI = MIJOZ)
   O'ng panel: 9 bosqich + jonli ball + feedback + qizil bayroqlar
   Model: claude-sonnet-4-6  |  React state (localStorage YO'Q)
   ============================================================ */

const MODEL = "claude-sonnet-4-6";

const BOSQICHLAR = [
  { n: 1, nom: "Salomlashish", izoh: "Ishonch va ochiqlik yaratish" },
  { n: 2, nom: "Programmalashtirish", izoh: "Suhbat tartibini kelishish" },
  { n: 3, nom: "So'rovni aniqlash", izoh: "Nima kerakligini ochish" },
  { n: 4, nom: "B nuqta (raqam bilan)", izoh: "Xohlagan natijasi — raqamda" },
  { n: 5, nom: "A nuqta", izoh: "Hozirgi holati" },
  { n: 6, nom: "Og'riq", izoh: "Muammoni chuqurlashtirish" },
  { n: 7, nom: "Umumlashtirish", izoh: "Eshitganini qaytarib berish" },
  { n: 8, nom: "Yechim + narx", izoh: "Taklif va narxni ochish" },
  { n: 9, nom: "E'tiroz + yopish", izoh: "E'tirozni yechib, kelishuv" },
];

const QIZIL_BAYROQLAR = {
  javobsiz_savol: "Mijoz savoli javobsiz qoldi",
  sababsiz_narx: "Narx sababsiz tushirildi",
  raqam_xatosi: "Raqam xatosi (oborot ↔ sof foyda)",
  kafolat_muddatsiz: "Kafolatda muddat/shart ko'rsatilmadi",
  yopish_olasizmi: "Yopish «olasizmi?» shaklida (to'g'risi: «qaysi biri?»)",
};

/* ---------- TASODIFIY MIJOZ generatori ---------- */

const ISMLAR = [
  "Rustam aka", "Dilshod aka", "Bekzod aka", "Sardor aka", "Jasur aka",
  "Otabek aka", "Aziz aka", "Farrux aka", "Ulug'bek aka", "Sanjar aka",
  "Shuhrat aka", "Alisher aka", "Nodira opa", "Gulnora opa", "Shahnoza opa",
  "Kamola opa", "Malika opa", "Dilnoza opa", "Zuhra opa", "Feruza opa",
];

// Oborot diapazoni biznes turiga qarab
const OBOROTLAR = {
  B2B: ["oyiga ~500 mln so'm", "oyiga ~800 mln so'm", "oyiga ~1.2 mlrd so'm", "oyiga ~2 mlrd so'm"],
  B2C: ["oyiga ~40 mln so'm", "oyiga ~60 mln so'm", "oyiga ~120 mln so'm", "oyiga ~200 mln so'm"],
  B2G: ["yillik ~1.5 mlrd so'm shartnoma", "yillik ~3 mlrd so'm tender", "yillik ~5 mlrd so'm"],
};

const MARJALAR = ["12%", "15%", "18%", "22%", "25%", "30%"];

const TAJRIBALAR = [
  "Bir marta reklama agentligi bilan ishlagan, natija chiqmagan, ishonchi susaygan",
  "O'zi post qo'yib ko'rgan, hech nima chiqmagan",
  "Hech qachon agentlik bilan ishlamagan, sxemani tushunmaydi",
  "Ilgari SMM'chi yollagan, pul ketgan, natija yo'q",
  "Tanishi orqali ishlagan, yarim yo'lda tashlab ketishgan",
  "Raqobatchisi agentlik bilan ishlab o'zib ketgan, shuni ko'rgan",
];

const ETIROZLAR_POOL = [
  "Qimmat ekan", "Hozir byudjet yo'q", "Keyinroq gaplashaylik",
  "Menga reklama kerak emas", "O'zim uddalayman", "Ishlashiga ishonmayman",
  "Pulni qaytarasizmi?", "Natija kafolati bormi?", "Raqobatchilar arzonroq",
  "O'ylab ko'ray", "Oldin ishlaganman, foyda bo'lmagan", "Menga vaqt yo'q",
];

const YASHIRIN_POOL = [
  "Aslida ishonchli, uzoq muddatli hamkor va real kafolat izlayapti",
  "Barqaror mijoz oqimi va tayyor tizim kerak, o'zi vaqt sarflashni xohlamaydi",
  "Xavfsizlik va kafolat kerak — «puldan ayrilmaslik» tuyg'usi asosiy",
  "Raqobatchidan o'zib ketishni xohlaydi, lekin buni ochiq aytmaydi",
  "Jamoasiga «to'g'ri qaror qildim» deb isbotlashi kerak",
  "Tez va'da emas, ishonchli, tushunadigan hamkor muhim",
];

// Biznes turlari: B2B / B2C / B2G aralash
const BIZNESLAR = [
  { nisha: "Nasos savdosi (ishlab chiqarish korxonalari)", tur: "B2B", ogriq: ["Xitoy nasoslari tez ishdan chiqyapti, mijozlar qaytib shikoyat qilyapti", "Yirik mijozlar raqobatchiga o'tib ketyapti", "Sotuv bo'limi lidlarni yopolmayapti"] },
  { nisha: "Sanoat uskunalari yetkazib berish", tur: "B2B", ogriq: ["Yangi mijoz topish qiyinlashgan", "Katta shartnomalar cho'zilib ketyapti"] },
  { nisha: "PPR va metal quvurlar ulgurji savdosi", tur: "B2B", ogriq: ["Doimiy mijozlar narx so'rab boshqadan olib ketyapti", "Ombor to'lgan, aylanma sekin"] },
  { nisha: "Qurilish materiallari ulgurji", tur: "B2B", ogriq: ["Nasiya berib qarz ko'paygan", "Raqobat kuchli, narx bosimi bor"] },
  { nisha: "Santexnika chakana do'koni", tur: "B2C", ogriq: ["Do'konga odam kirmayapti, Instagram bor lekin sotuv yo'q", "Onlayn buyurtma umuman yo'q"] },
  { nisha: "Elektr suv isitgich (bo'yler) chakana", tur: "B2C", ogriq: ["Raqobatchilar arzonroq narx qo'yyapti, mijoz taqqoslab ketyapti", "Mavsumda sotuv tushib ketadi"] },
  { nisha: "Konditsioner o'rnatish xizmati", tur: "B2C", ogriq: ["Mijozlar faqat mavsumda keladi, qishda ish yo'q", "Reklama pulini isrof qilgandek his qilyapti"] },
  { nisha: "Dekorativ PVC panel chakana", tur: "B2C", ogriq: ["Mahsulotni odamlar tanimaydi, tushuntirish kerak", "Ustalar tavsiya qilmayapti"] },
  { nisha: "Mebel saloni", tur: "B2C", ogriq: ["Salonga kelgan mijoz «o'ylab ko'raman» deb ketadi", "Lidlardan sotuv chiqmayapti"] },
  { nisha: "Maktab va kasalxonalarga jihoz yetkazish (tender)", tur: "B2G", ogriq: ["Tenderlarda faqat narx bo'yicha yutqazyapti", "To'lovlar kechikadi, aylanma qotib qolyapti"] },
  { nisha: "Kommunal obyektlarga nasos stansiyalari", tur: "B2G", ogriq: ["Loyihalar cho'ziladi, qaror sekin", "Bir necha bo'lim bilan kelishish kerak"] },
  { nisha: "Davlat obyektlariga isitish tizimlari", tur: "B2G", ogriq: ["Byudjet cheklangan, narx bosim ostida", "Texnik talablar murakkab, hujjat ko'p"] },
];

function tanla(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Analitika: hodisani serverga yuboradi (xatoni jim yutadi) ---
function trackEvent(payload) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (e) {}
}
function segmentNishadan(nisha) {
  const q = String(nisha || "").split("—");
  return q.length > 1 ? q[q.length - 1].trim() : "";
}

function tasodifiySon(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function nechta(arr, n) {
  const nusxa = [...arr];
  const natija = [];
  for (let i = 0; i < n && nusxa.length; i++) {
    natija.push(nusxa.splice(Math.floor(Math.random() * nusxa.length), 1)[0]);
  }
  return natija;
}

// Ma'lum bir biznes uchun persona quradi (nisha aniq, qolgani tasodifiy)
function personaFromBiz(biz) {
  return {
    nisha: `${biz.nisha} — ${biz.tur}`,
    ism: tanla(ISMLAR),
    oborot: tanla(OBOROTLAR[biz.tur]),
    marja: tanla(MARJALAR),
    ogriq: tanla(biz.ogriq),
    oldingi_tajriba: tanla(TAJRIBALAR),
    qarshilik_darajasi: tasodifiySon(4, 9),
    asosiy_etirozlar: nechta(ETIROZLAR_POOL, 3),
    yashirin_talab: tanla(YASHIRIN_POOL),
  };
}

// To'liq tasodifiy mijoz (istalgan segment, istalgan mahsulot)
function tasodifiyPersona() {
  return personaFromBiz(tanla(BIZNESLAR));
}

function bo(role) {
  return role === "sotuvchi" ? "user" : "assistant";
}

function stripFences(t) {
  return (t || "").replace(/```json/gi, "").replace(/```/g, "").trim();
}

function textFrom(data) {
  if (!data || !Array.isArray(data.content)) return "";
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

async function callClaude({ system, messages, max_tokens = 1000 }) {
  // API kaliti backendda (Netlify Function) yashirin saqlanadi.
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens }),
  });
  if (!res.ok) {
    let msg = "API xatosi: " + res.status;
    try {
      const j = await res.json();
      if (j && j.error) msg = j.error;
    } catch (e) {}
    throw new Error(msg);
  }
  return await res.json();
}

/* ---------- System prompt quruvchilar ---------- */

function mijozSystem(p, rejim) {
  return `Sen sotuv treningi uchun MIJOZ rolini o'ynaysan. Sotuvchi (foydalanuvchi) senga biror xizmat sotmoqchi. Sen quyidagi personasan:

${JSON.stringify(p, null, 2)}

QAT'IY QOIDALAR:
1. Ma'lumotni BIRDAN berma. Oboroting, marjang, og'riging, oldingi tajribang, yashirin talabing — bularni FAQAT sotuvchi aniq va to'g'ri savol bergandagina, bosqichma-bosqich och. Umumiy savolga umumiy javob ber.
2. Boshida biroz sovuq va shubhali bo'l. Qarshilik darajang: ${p.qarshilik_darajasi}/10 — qancha yuqori bo'lsa, shuncha qattiq bo'l, e'tiroz ko'proq bildir, tez ishonma.
3. Agar sotuvchi RAQAM XATOSI qilsa — masalan sening oborotingni sof foyda deb chalkashtirsa yoki hisobni noto'g'ri qilsa — DARROV to'xtat va e'tiroz bildir: "To'xtang, bu oborot-ku, sof foyda emas" degan ma'noda tuzat.
4. Yashirin talabingni (${p.yashirin_talab}) faqat sotuvchi og'riging va so'rovingni chinakam ochib, ishonchni qozongandagina namoyon qil.
5. Asosiy e'tirozlaringni (${(p.asosiy_etirozlar || []).join(", ")}) o'rinli joyda ishlat, ayniqsa narx aytilganda.
6. Real odamdek gapir: qisqa, tabiiy, o'zbek tilida (lotin). Har javobing 1-4 gap. Rol nomini ("MIJOZ") yozma, shunchaki personadek javob ber.
7. Agar sotuvchi yaxshi ishlasa — asta iliy, ochil. Yomon ishlasa — sovi, "o'ylab ko'raman" deb yopilib qol.`;
}

function evalSystem() {
  return `Sen sotuv suhbatini baholovchi qattiqqo'l EKSPERTsan. Sotuvchining OXIRGI xabarini 9 bosqichli metodika bo'yicha baholaysan.

Bosqichlar: 1 Salomlashish, 2 Programmalashtirish, 3 So'rovni aniqlash, 4 B nuqta (raqam bilan), 5 A nuqta, 6 Og'riq, 7 Umumlashtirish, 8 Yechim+narx, 9 E'tiroz+yopish.

Qizil bayroq kalitlari (agar sodir bo'lsa massivga qo'sh):
- "javobsiz_savol" — mijoz bergan savol javobsiz qoldirildi
- "sababsiz_narx" — narx asossiz tushirildi
- "raqam_xatosi" — oborot va sof foyda chalkashtirildi yoki hisob xato
- "kafolat_muddatsiz" — kafolat aytildi lekin muddat/shart ko'rsatilmadi
- "yopish_olasizmi" — yopish "olasizmi/kelishdikmi?" shaklida (to'g'risi tanlov: "qaysi biri?")

FAQAT JSON qaytar. Markdown, izoh, backtick YO'Q. Aniq format:
{"ball": <0-10 butun son>, "izoh": "<1 qisqa gap, aniq maslahat>", "bosqich": <1-9, suhbat hozir qaysi bosqichda>, "qizil_bayroqlar": [<kalitlar>]}`;
}

function reviewSystem() {
  return `Sen sotuv trenerisan. Butun suhbatni ko'rib, sotuvchiga to'liq RAZBOR ber. FAQAT JSON qaytar, markdownsiz:
{"umumiy_ball": <0-10>, "bosqichlar": [{"nom": "<bosqich nomi>", "holat": "<yaxshi|o'rtacha|o'tkazib yuborildi>", "izoh": "<1 gap>"}], "kuchli": ["<...>"], "zaif": ["<...>"], "xulosa": "<2-3 gap umumiy maslahat>"}
Baholash real va halol bo'lsin — maqtov uchun ball qo'shma.`;
}

/* ============================================================ */

export default function SotuvTrenajyori() {
  const [persona, setPersona] = useState(tasodifiyPersona);
  const [personaText, setPersonaText] = useState(() =>
    JSON.stringify(persona, null, 2)
  );
  const [personaXato, setPersonaXato] = useState("");
  const [personaOchiq, setPersonaOchiq] = useState(false);
  const [segment, setSegment] = useState(null); // 'B2B' | 'B2C' | 'B2G'

  const [rejim, setRejim] = useState("ekspert"); // 'yordam' | 'ekspert'
  const [messages, setMessages] = useState([]); // {role:'sotuvchi'|'mijoz', text}
  const [evals, setEvals] = useState([]); // {ball, izoh}
  const [reachedStage, setReachedStage] = useState(0);
  const [curStage, setCurStage] = useState(0);
  const [flags, setFlags] = useState({}); // {key: true}
  const [lastFeedback, setLastFeedback] = useState(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [xato, setXato] = useState("");

  const [yordam, setYordam] = useState([]); // takliflar
  const [yordamLoading, setYordamLoading] = useState(false);

  const [tugadi, setTugadi] = useState(false);
  const [review, setReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [mobil, setMobil] = useState("chat"); // 'chat'|'monitor' (kichik ekranlar uchun)

  const chatEnd = useRef(null);
  const sidRef = useRef(Math.random().toString(36).slice(2, 10));
  const trackedRef = useRef(false);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const avg =
    evals.length > 0
      ? evals.reduce((s, e) => s + (e.ball || 0), 0) / evals.length
      : 0;

  function personaOzgardi(t) {
    setPersonaText(t);
    try {
      const parsed = JSON.parse(t);
      setPersona(parsed);
      setPersonaXato("");
    } catch (e) {
      setPersonaXato("JSON xato — tuzatib qo'ying");
    }
  }

  function bizTanla(biz) {
    const p = personaFromBiz(biz);
    setPersona(p);
    setPersonaText(JSON.stringify(p, null, 2));
    setPersonaXato("");
    yangiSuhbat();
  }

  function yangiSuhbat() {
    setMessages([]);
    trackedRef.current = false;
    setEvals([]);
    setReachedStage(0);
    setCurStage(0);
    setFlags({});
    setLastFeedback(null);
    setYordam([]);
    setTugadi(false);
    setReview(null);
    setXato("");
  }

  // Yangi tasodifiy mijoz + suhbatni tozalaydi
  function yangiTasodifiy() {
    const p = tasodifiyPersona();
    setPersona(p);
    setPersonaText(JSON.stringify(p, null, 2));
    setPersonaXato("");
    yangiSuhbat();
  }

  async function xabarYubor() {
    const matn = input.trim();
    if (!matn || loading || tugadi) return;
    if (personaXato) {
      setXato("Persona JSON xato — avval uni tuzating");
      return;
    }
    setXato("");
    setYordam([]);
    const yangi = [...messages, { role: "sotuvchi", text: matn }];
    setMessages(yangi);
    setInput("");
    setLoading(true);

    // Analitika: suhbatning birinchi xabarida bir marta yozib qo'yamiz
    if (!trackedRef.current) {
      trackedRef.current = true;
      trackEvent({
        event: "suhbat",
        nisha: persona.nisha,
        segment: segmentNishadan(persona.nisha),
        rejim,
        sid: sidRef.current,
      });
    }

    try {
      // 1-chaqiruv: MIJOZ javobi
      const mijozData = await callClaude({
        system: mijozSystem(persona, rejim),
        messages: yangi.map((m) => ({ role: bo(m.role), content: m.text })),
      });
      const mijozJavob = textFrom(mijozData) || "…";
      const bilanMijoz = [...yangi, { role: "mijoz", text: mijozJavob }];
      setMessages(bilanMijoz);

      // 2-chaqiruv: BAHOLASH (faqat JSON)
      const transkript = bilanMijoz
        .map((m) => `${m.role === "sotuvchi" ? "SOTUVCHI" : "MIJOZ"}: ${m.text}`)
        .join("\n");
      const evalData = await callClaude({
        system: evalSystem(),
        messages: [
          {
            role: "user",
            content: `Persona: ${JSON.stringify(persona)}\n\nSuhbat:\n${transkript}\n\nSotuvchining oxirgi xabarini bahola.`,
          },
        ],
      });
      try {
        const j = JSON.parse(stripFences(textFrom(evalData)));
        setEvals((prev) => [...prev, { ball: j.ball, izoh: j.izoh }]);
        setLastFeedback({ ball: j.ball, izoh: j.izoh });
        if (typeof j.bosqich === "number") {
          setCurStage(j.bosqich);
          setReachedStage((r) => Math.max(r, j.bosqich));
        }
        if (Array.isArray(j.qizil_bayroqlar)) {
          setFlags((prev) => {
            const yang = { ...prev };
            j.qizil_bayroqlar.forEach((k) => {
              if (QIZIL_BAYROQLAR[k]) yang[k] = true;
            });
            return yang;
          });
        }
      } catch (e) {
        // baholash JSON o'qilmadi — suhbatni buzmaymiz
      }
    } catch (e) {
      setXato(e.message || "Nimadir xato ketdi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  async function yordamSora() {
    if (loading || yordamLoading || tugadi) return;
    setYordamLoading(true);
    setXato("");
    try {
      const transkript = messages
        .map((m) => `${m.role === "sotuvchi" ? "SOTUVCHI" : "MIJOZ"}: ${m.text}`)
        .join("\n") || "(suhbat hali boshlanmagan)";
      const data = await callClaude({
        system: `Sen sotuv trenerisan. Sotuvchiga hozirgi vaziyat uchun 2-3 ta tayyor, kuchli formulirovka (aynan aytadigan gaplari) ber. FAQAT JSON massiv qaytar, markdownsiz: ["gap1","gap2","gap3"]. Gaplar o'zbek tilida, qisqa va tabiiy bo'lsin.`,
        messages: [
          {
            role: "user",
            content: `Persona: ${JSON.stringify(persona)}\nHozirgi bosqich: ${curStage || 1} (${BOSQICHLAR[(curStage || 1) - 1]?.nom}).\n\nSuhbat:\n${transkript}\n\nSotuvchi endi nima desa yaxshi bo'ladi?`,
          },
        ],
      });
      let arr = [];
      try {
        arr = JSON.parse(stripFences(textFrom(data)));
      } catch (e) {
        arr = [textFrom(data)];
      }
      setYordam(Array.isArray(arr) ? arr : [String(arr)]);
    } catch (e) {
      setXato(e.message || "Yordam olishда xato.");
    } finally {
      setYordamLoading(false);
    }
  }

  async function suhbatniYakunla() {
    if (messages.length === 0 || reviewLoading) return;
    setReviewLoading(true);
    setTugadi(true);
    setXato("");
    try {
      const transkript = messages
        .map((m) => `${m.role === "sotuvchi" ? "SOTUVCHI" : "MIJOZ"}: ${m.text}`)
        .join("\n");
      const data = await callClaude({
        system: reviewSystem(),
        messages: [
          {
            role: "user",
            content: `Persona: ${JSON.stringify(persona)}\n\nTo'liq suhbat:\n${transkript}\n\nRazbor ber.`,
          },
        ],
        max_tokens: 1500,
      });
      try {
        setReview(JSON.parse(stripFences(textFrom(data))));
      } catch (e) {
        setReview({ xulosa: textFrom(data), bosqichlar: [], kuchli: [], zaif: [] });
      }
    } catch (e) {
      setXato(e.message || "Razbor tayyorlashda xato.");
    } finally {
      setReviewLoading(false);
    }
  }

  const ballRang = (b) =>
    b >= 7 ? "var(--green)" : b >= 4 ? "var(--gold)" : "var(--red)";

  return (
    <div className="st-root">
      <style>{CSS}</style>

      {/* ===== TEPA PANEL ===== */}
      <header className="st-top">
        <div className="st-brand">
          <span className="st-dot" />
          <div>
            <div className="st-title">SOTUV TRENAJYORI</div>
            <div className="st-sub">Mijoz — jonli. Har gap — baholanadi.</div>
          </div>
        </div>

        <div className="st-top-right">
          <div className="st-modes">
            <button
              className={"st-mode " + (rejim === "yordam" ? "on" : "")}
              onClick={() => setRejim("yordam")}
            >
              🟢 Yordam
            </button>
            <button
              className={"st-mode " + (rejim === "ekspert" ? "on" : "")}
              onClick={() => setRejim("ekspert")}
            >
              🔴 Ekspert
            </button>
          </div>
          <button className="st-ghost st-ghost-random" onClick={yangiTasodifiy}>
            🎲 Tasodifiy
          </button>
          <button className="st-ghost" onClick={() => setPersonaOchiq((v) => !v)}>
            Persona
          </button>
          <button className="st-ghost" onClick={yangiSuhbat}>
            Yangi
          </button>
        </div>
      </header>

      {/* mobil almashtirgich */}
      <div className="st-mobile-tabs">
        <button className={mobil === "chat" ? "on" : ""} onClick={() => setMobil("chat")}>Suhbat</button>
        <button className={mobil === "monitor" ? "on" : ""} onClick={() => setMobil("monitor")}>Panel</button>
      </div>

      <div className="st-body">
        {/* ================= CHAT ================= */}
        <section className={"st-chat " + (mobil === "chat" ? "show" : "hide")}>
          <div className="st-msgs">
            {messages.length === 0 && (
              <div className="st-empty">
                <div className="st-empty-badge">MIJOZ TAYYOR</div>
                <p>
                  Chapda siz — <b>sotuvchi</b>. O'ngdagi mijoz «{persona.ism}» sizni
                  kutyapti. Salomlashishdan boshlang va 9 bosqich bo'ylab
                  yopishgacha olib boring.
                </p>
                <p className="st-empty-hint">
                  Mijoz ma'lumotni birdan bermaydi — to'g'ri savol bering.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={"st-row " + m.role}>
                <div className="st-avatar">{m.role === "sotuvchi" ? "S" : persona.ism?.[0] || "M"}</div>
                <div className="st-bubble">
                  <div className="st-who">{m.role === "sotuvchi" ? "Siz" : persona.ism || "Mijoz"}</div>
                  <div className="st-text">{m.text}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="st-row mijoz">
                <div className="st-avatar">{persona.ism?.[0] || "M"}</div>
                <div className="st-bubble">
                  <div className="st-who">{persona.ism}</div>
                  <div className="st-typing"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          {/* yordam takliflari */}
          {rejim === "yordam" && yordam.length > 0 && (
            <div className="st-help">
              <div className="st-help-h">Tayyor formulirovkalar — bosib qo'ying:</div>
              {yordam.map((y, i) => (
                <button key={i} className="st-help-item" onClick={() => setInput(y)}>
                  {y}
                </button>
              ))}
            </div>
          )}

          {xato && <div className="st-error">{xato}</div>}

          {/* kirish */}
          <div className="st-input-wrap">
            {rejim === "yordam" && (
              <button
                className="st-help-btn"
                onClick={yordamSora}
                disabled={yordamLoading || tugadi}
                title="Vaziyat uchun tayyor gaplar"
              >
                {yordamLoading ? "…" : "Yordam"}
              </button>
            )}
            <textarea
              className="st-input"
              placeholder={tugadi ? "Suhbat yakunlandi. «Yangi» bosing." : "Mijozga yozing…"}
              value={input}
              disabled={tugadi}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  xabarYubor();
                }
              }}
              rows={1}
            />
            <button className="st-send" onClick={xabarYubor} disabled={loading || tugadi}>
              {loading ? "…" : "Yubor"}
            </button>
          </div>
        </section>

        {/* ================= MONITORING ================= */}
        <aside className={"st-monitor " + (mobil === "monitor" ? "show" : "hide")}>
          {/* jonli ball */}
          <div className="st-gauge-card">
            <div className="st-gauge">
              <svg viewBox="0 0 120 120" width="118" height="118">
                <circle cx="60" cy="60" r="52" className="st-gauge-bg" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="st-gauge-fg"
                  style={{
                    stroke: ballRang(avg),
                    strokeDasharray: 2 * Math.PI * 52,
                    strokeDashoffset: 2 * Math.PI * 52 * (1 - avg / 10),
                  }}
                />
              </svg>
              <div className="st-gauge-num" style={{ color: ballRang(avg) }}>
                {evals.length ? avg.toFixed(1) : "–"}
                <span>/10</span>
              </div>
            </div>
            <div className="st-gauge-meta">
              <div className="st-gauge-label">O'RTACHA BALL</div>
              {lastFeedback && (
                <div className="st-lastfb">
                  <span className="st-lastfb-ball" style={{ color: ballRang(lastFeedback.ball) }}>
                    +{lastFeedback.ball}
                  </span>
                  <span className="st-lastfb-txt">{lastFeedback.izoh}</span>
                </div>
              )}
            </div>
          </div>

          {/* 9 bosqich */}
          <div className="st-stages">
            <div className="st-stages-h">9 BOSQICH</div>
            {BOSQICHLAR.map((b) => {
              const done = reachedStage > b.n;
              const active = curStage === b.n;
              return (
                <div key={b.n} className={"st-stage " + (active ? "active " : "") + (done ? "done" : "")}>
                  <div className="st-stage-n">{done ? "✓" : b.n}</div>
                  <div className="st-stage-body">
                    <div className="st-stage-nom">{b.nom}</div>
                    <div className="st-stage-izoh">{b.izoh}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* qizil bayroqlar */}
          <div className="st-flags">
            <div className="st-flags-h">
              QIZIL BAYROQLAR
              <span className="st-flags-count">{Object.keys(flags).length}/5</span>
            </div>
            {Object.entries(QIZIL_BAYROQLAR).map(([k, v]) => (
              <div key={k} className={"st-flag " + (flags[k] ? "hit" : "")}>
                <span className="st-flag-ind" />
                {v}
              </div>
            ))}
          </div>

          <button
            className="st-finish"
            onClick={suhbatniYakunla}
            disabled={messages.length === 0 || reviewLoading}
          >
            {reviewLoading ? "Razbor tayyorlanyapti…" : "Suhbatni yakunlash"}
          </button>
        </aside>
      </div>

      {/* ===== PERSONA TAHRIRLAGICH ===== */}
      {personaOchiq && (
        <div className="st-overlay" onClick={() => setPersonaOchiq(false)}>
          <div className="st-modal" onClick={(e) => e.stopPropagation()}>
            <div className="st-modal-h">
              <span>MIJOZ PERSONASI</span>
              <button onClick={() => setPersonaOchiq(false)}>✕</button>
            </div>
            <div className="st-seg-label">Tasodifiy yoki segment tanlang:</div>
            <div className="st-presets">
              <button className="st-preset st-preset-random" onClick={yangiTasodifiy}>
                🎲 Tasodifiy
              </button>
              {["B2B", "B2C", "B2G"].map((t) => (
                <button
                  key={t}
                  className={"st-preset " + (segment === t ? "on" : "")}
                  onClick={() => setSegment(segment === t ? null : t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {segment && (
              <div className="st-presets st-presets-sub">
                {BIZNESLAR.filter((b) => b.tur === segment).map((b) => (
                  <button
                    key={b.nisha}
                    className="st-preset"
                    onClick={() => bizTanla(b)}
                  >
                    {b.nisha}
                  </button>
                ))}
              </div>
            )}
            <textarea
              className="st-json"
              value={personaText}
              onChange={(e) => personaOzgardi(e.target.value)}
              spellCheck={false}
            />
            {personaXato ? (
              <div className="st-json-err">{personaXato}</div>
            ) : (
              <div className="st-json-ok">JSON to'g'ri ✓ — o'zgarish darrov qo'llanadi</div>
            )}
          </div>
        </div>
      )}

      {/* ===== RAZBOR ===== */}
      {tugadi && review && (
        <div className="st-overlay" onClick={() => setTugadi(false)}>
          <div className="st-modal st-review" onClick={(e) => e.stopPropagation()}>
            <div className="st-modal-h">
              <span>TO'LIQ RAZBOR</span>
              <button onClick={() => setTugadi(false)}>✕</button>
            </div>

            <div className="st-review-score" style={{ color: ballRang(review.umumiy_ball || 0) }}>
              {review.umumiy_ball ?? "–"}<span>/10</span>
              <div className="st-review-score-l">UMUMIY BAHO</div>
            </div>

            {Array.isArray(review.bosqichlar) && review.bosqichlar.length > 0 && (
              <div className="st-review-block">
                <h4>Bosqichlar bo'yicha</h4>
                {review.bosqichlar.map((b, i) => (
                  <div key={i} className="st-review-stage">
                    <span className={"st-holat " + (b.holat || "").toLowerCase().replace(/[\s'\u2018\u2019`]/g, "")}>{b.holat}</span>
                    <b>{b.nom}</b> — {b.izoh}
                  </div>
                ))}
              </div>
            )}

            <div className="st-review-cols">
              {Array.isArray(review.kuchli) && review.kuchli.length > 0 && (
                <div className="st-review-block">
                  <h4 className="ok">Kuchli tomonlar</h4>
                  <ul>{review.kuchli.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              )}
              {Array.isArray(review.zaif) && review.zaif.length > 0 && (
                <div className="st-review-block">
                  <h4 className="bad">Zaif tomonlar</h4>
                  <ul>{review.zaif.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              )}
            </div>

            {review.xulosa && (
              <div className="st-review-block">
                <h4>Xulosa</h4>
                <p>{review.xulosa}</p>
              </div>
            )}

            <button className="st-finish" onClick={yangiSuhbat}>
              Yangi suhbat boshlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   THEME — "trening kabinasi": chap yorug' suhbat, o'ng qorong'u panel
   ============================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.st-root{
  --ink:#0E1420; --ink-2:#151E2E; --ink-3:#1E293B;
  --paper:#EAEDF2; --card:#FFFFFF;
  --cyan:#00AFEF; --gold:#FFBA37; --red:#FF4D4D; --green:#2FBF71;
  --line:rgba(148,163,184,.22); --line-dark:rgba(148,163,184,.14);
  --txt:#0E1420; --txt-dim:#5B6675; --txt-inv:#E6ECF5; --txt-inv-dim:#8A99B0;
  font-family:'Space Grotesk',system-ui,sans-serif;
  height:100vh; display:flex; flex-direction:column;
  background:var(--paper); color:var(--txt); overflow:hidden;
}
.st-root *{box-sizing:border-box;}

/* TOP */
.st-top{display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:12px 18px;background:var(--ink);color:var(--txt-inv);
  border-bottom:1px solid rgba(0,175,239,.25);flex-wrap:wrap;}
.st-brand{display:flex;align-items:center;gap:12px;}
.st-dot{width:12px;height:12px;border-radius:50%;background:var(--green);
  box-shadow:0 0 0 4px rgba(47,191,113,.18);animation:pulse 2s infinite;}
@keyframes pulse{50%{box-shadow:0 0 0 8px rgba(47,191,113,0);}}
.st-title{font-weight:700;letter-spacing:.14em;font-size:15px;}
.st-sub{font-size:11px;color:var(--txt-inv-dim);letter-spacing:.02em;}
.st-top-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.st-modes{display:flex;background:var(--ink-2);border-radius:9px;padding:3px;border:1px solid var(--line-dark);}
.st-mode{border:0;background:transparent;color:var(--txt-inv-dim);padding:6px 12px;
  border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:500;transition:.15s;}
.st-mode.on{background:var(--ink-3);color:var(--txt-inv);}
.st-ghost{border:1px solid var(--line-dark);background:transparent;color:var(--txt-inv-dim);
  padding:7px 12px;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit;transition:.15s;}
.st-ghost:hover{color:var(--txt-inv);border-color:var(--cyan);}

/* mobile tabs */
.st-mobile-tabs{display:none;background:var(--ink);padding:0 12px 10px;gap:8px;}
.st-mobile-tabs button{flex:1;padding:9px;border:1px solid var(--line-dark);background:var(--ink-2);
  color:var(--txt-inv-dim);border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer;}
.st-mobile-tabs button.on{background:var(--cyan);color:#04121b;border-color:var(--cyan);font-weight:600;}

.st-body{flex:1;display:grid;grid-template-columns:1fr 360px;min-height:0;}

/* CHAT */
.st-chat{display:flex;flex-direction:column;min-height:0;background:var(--paper);}
.st-msgs{flex:1;overflow-y:auto;padding:22px 26px;display:flex;flex-direction:column;gap:16px;}
.st-empty{max-width:440px;margin:auto;text-align:center;color:var(--txt-dim);}
.st-empty-badge{display:inline-block;font-size:11px;letter-spacing:.16em;font-weight:600;
  color:var(--cyan);border:1px solid var(--cyan);border-radius:20px;padding:5px 14px;margin-bottom:16px;}
.st-empty p{font-size:14px;line-height:1.6;margin:8px 0;}
.st-empty b{color:var(--txt);}
.st-empty-hint{font-size:12.5px;color:var(--txt-dim);opacity:.8;}

.st-row{display:flex;gap:11px;max-width:80%;}
.st-row.sotuvchi{align-self:flex-end;flex-direction:row-reverse;}
.st-avatar{width:34px;height:34px;border-radius:9px;flex:0 0 auto;display:flex;
  align-items:center;justify-content:center;font-weight:600;font-size:14px;color:#fff;}
.st-row.sotuvchi .st-avatar{background:var(--ink);}
.st-row.mijoz .st-avatar{background:var(--cyan);color:#04121b;}
.st-bubble{background:var(--card);border:1px solid var(--line);border-radius:14px;
  padding:10px 14px;box-shadow:0 1px 2px rgba(15,22,35,.04);}
.st-row.sotuvchi .st-bubble{background:var(--ink);color:var(--txt-inv);border-color:transparent;}
.st-row.sotuvchi .st-bubble{border-top-right-radius:4px;}
.st-row.mijoz .st-bubble{border-top-left-radius:4px;}
.st-who{font-size:11px;font-weight:600;letter-spacing:.04em;margin-bottom:3px;opacity:.55;}
.st-text{font-size:14.5px;line-height:1.55;white-space:pre-wrap;}
.st-typing{display:flex;gap:4px;padding:4px 2px;}
.st-typing span{width:7px;height:7px;border-radius:50%;background:var(--cyan);opacity:.4;
  animation:blink 1.2s infinite;}
.st-typing span:nth-child(2){animation-delay:.2s;}
.st-typing span:nth-child(3){animation-delay:.4s;}
@keyframes blink{0%,60%,100%{opacity:.25;}30%{opacity:1;}}

/* help */
.st-help{padding:10px 20px;border-top:1px dashed var(--line);background:rgba(0,175,239,.05);}
.st-help-h{font-size:11px;letter-spacing:.06em;color:var(--txt-dim);margin-bottom:8px;font-weight:600;}
.st-help-item{display:block;width:100%;text-align:left;background:var(--card);
  border:1px solid var(--line);border-radius:9px;padding:9px 12px;margin-bottom:7px;
  font-family:inherit;font-size:13.5px;color:var(--txt);cursor:pointer;transition:.15s;}
.st-help-item:hover{border-color:var(--cyan);background:#fff;transform:translateX(2px);}

.st-error{margin:0 20px 8px;background:rgba(255,77,77,.1);border:1px solid var(--red);
  color:#b91c1c;font-size:12.5px;padding:8px 12px;border-radius:8px;}

/* input */
.st-input-wrap{display:flex;gap:9px;padding:14px 20px;border-top:1px solid var(--line);
  background:var(--card);align-items:flex-end;}
.st-help-btn{background:var(--gold);border:0;color:#3a2600;font-weight:600;
  padding:11px 15px;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;flex:0 0 auto;transition:.15s;}
.st-help-btn:hover:not(:disabled){filter:brightness(1.05);}
.st-help-btn:disabled{opacity:.5;cursor:default;}
.st-input{flex:1;resize:none;border:1px solid var(--line);border-radius:10px;
  padding:11px 13px;font-family:inherit;font-size:14.5px;max-height:130px;background:var(--paper);
  color:var(--txt);line-height:1.4;}
.st-input:focus{outline:none;border-color:var(--cyan);background:#fff;}
.st-send{background:var(--ink);border:0;color:#fff;font-weight:600;padding:11px 20px;
  border-radius:10px;cursor:pointer;font-family:inherit;font-size:14px;flex:0 0 auto;transition:.15s;}
.st-send:hover:not(:disabled){background:var(--cyan);color:#04121b;}
.st-send:disabled{opacity:.5;cursor:default;}

/* MONITOR */
.st-monitor{background:var(--ink);color:var(--txt-inv);border-left:1px solid rgba(0,175,239,.2);
  padding:18px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;}

.st-gauge-card{display:flex;gap:14px;align-items:center;background:var(--ink-2);
  border:1px solid var(--line-dark);border-radius:14px;padding:14px;}
.st-gauge{position:relative;width:118px;height:118px;flex:0 0 auto;}
.st-gauge svg{transform:rotate(-90deg);}
.st-gauge-bg{fill:none;stroke:rgba(255,255,255,.08);stroke-width:8;}
.st-gauge-fg{fill:none;stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .6s ease,stroke .3s;}
.st-gauge-num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:30px;font-weight:600;}
.st-gauge-num span{font-size:12px;opacity:.5;font-weight:400;}
.st-gauge-meta{flex:1;min-width:0;}
.st-gauge-label{font-size:10.5px;letter-spacing:.14em;color:var(--txt-inv-dim);font-weight:600;}
.st-lastfb{margin-top:8px;display:flex;gap:8px;align-items:flex-start;}
.st-lastfb-ball{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:15px;flex:0 0 auto;}
.st-lastfb-txt{font-size:12px;line-height:1.4;color:var(--txt-inv-dim);}

/* stages */
.st-stages{background:var(--ink-2);border:1px solid var(--line-dark);border-radius:14px;padding:8px;}
.st-stages-h{font-size:10.5px;letter-spacing:.14em;color:var(--txt-inv-dim);font-weight:600;
  padding:8px 10px 10px;}
.st-stage{display:flex;gap:11px;padding:8px 10px;border-radius:9px;align-items:center;transition:.2s;}
.st-stage-n{width:26px;height:26px;flex:0 0 auto;border-radius:7px;display:flex;align-items:center;
  justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;
  background:rgba(255,255,255,.06);color:var(--txt-inv-dim);border:1px solid transparent;}
.st-stage-nom{font-size:13px;font-weight:500;color:var(--txt-inv-dim);}
.st-stage-izoh{font-size:11px;color:var(--txt-inv-dim);opacity:.6;}
.st-stage.done .st-stage-n{background:rgba(47,191,113,.15);color:var(--green);}
.st-stage.done .st-stage-nom{color:var(--txt-inv);}
.st-stage.active{background:rgba(0,175,239,.1);}
.st-stage.active .st-stage-n{background:var(--cyan);color:#04121b;box-shadow:0 0 0 3px rgba(0,175,239,.2);}
.st-stage.active .st-stage-nom{color:#fff;font-weight:600;}

/* flags */
.st-flags{background:var(--ink-2);border:1px solid var(--line-dark);border-radius:14px;padding:12px 14px;}
.st-flags-h{font-size:10.5px;letter-spacing:.14em;color:var(--txt-inv-dim);font-weight:600;
  display:flex;justify-content:space-between;margin-bottom:10px;}
.st-flags-count{font-family:'IBM Plex Mono',monospace;color:var(--red);}
.st-flag{display:flex;align-items:center;gap:9px;font-size:12px;color:var(--txt-inv-dim);
  padding:5px 0;line-height:1.35;transition:.2s;}
.st-flag-ind{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.15);flex:0 0 auto;}
.st-flag.hit{color:#ffd7d7;}
.st-flag.hit .st-flag-ind{background:var(--red);box-shadow:0 0 8px var(--red);}

.st-finish{background:var(--cyan);border:0;color:#04121b;font-weight:700;padding:13px;
  border-radius:11px;cursor:pointer;font-family:inherit;font-size:14px;letter-spacing:.02em;transition:.15s;}
.st-finish:hover:not(:disabled){filter:brightness(1.06);}
.st-finish:disabled{opacity:.4;cursor:default;}

/* OVERLAY / MODAL */
.st-overlay{position:fixed;inset:0;background:rgba(8,12,20,.6);backdrop-filter:blur(3px);
  display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;}
.st-modal{background:var(--card);border-radius:16px;width:100%;max-width:560px;max-height:88vh;
  overflow-y:auto;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.3);}
.st-modal-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.st-modal-h span{font-weight:700;letter-spacing:.1em;font-size:13px;color:var(--txt);}
.st-modal-h button{border:0;background:var(--paper);width:30px;height:30px;border-radius:8px;
  cursor:pointer;font-size:14px;color:var(--txt-dim);}
.st-presets{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px;}
.st-preset{border:1px solid var(--line);background:var(--paper);color:var(--txt);
  padding:7px 12px;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;transition:.15s;}
.st-preset:hover{border-color:var(--cyan);background:#fff;}
.st-preset-random{background:var(--cyan);color:#04121b;border-color:var(--cyan);font-weight:600;}
.st-preset-random:hover{filter:brightness(1.05);background:var(--cyan);}
.st-preset.on{background:var(--ink);color:#fff;border-color:var(--ink);font-weight:600;}
.st-presets-sub{margin-top:-6px;padding-left:2px;border-left:2px solid var(--cyan);padding-left:10px;}
.st-seg-label{font-size:11px;letter-spacing:.06em;color:var(--txt-dim);font-weight:600;margin-bottom:8px;text-transform:uppercase;}
.st-ghost-random{border-color:var(--cyan);color:var(--cyan);}
.st-ghost-random:hover{background:rgba(0,175,239,.12);color:#fff;}
.st-json{width:100%;min-height:340px;font-family:'IBM Plex Mono',monospace;font-size:12.5px;
  line-height:1.6;border:1px solid var(--line);border-radius:11px;padding:14px;background:#0E1420;
  color:#c7e6f5;resize:vertical;}
.st-json:focus{outline:none;border-color:var(--cyan);}
.st-json-err{margin-top:8px;color:var(--red);font-size:12.5px;font-weight:500;}
.st-json-ok{margin-top:8px;color:var(--green);font-size:12.5px;}

/* review */
.st-review-score{font-family:'IBM Plex Mono',monospace;font-size:52px;font-weight:600;text-align:center;
  line-height:1;margin:6px 0 18px;}
.st-review-score span{font-size:20px;opacity:.5;}
.st-review-score-l{font-family:'Space Grotesk';font-size:11px;letter-spacing:.16em;color:var(--txt-dim);
  font-weight:600;margin-top:6px;}
.st-review-block{margin-bottom:16px;}
.st-review-block h4{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--txt-dim);
  margin:0 0 8px;font-weight:600;}
.st-review-block h4.ok{color:var(--green);}
.st-review-block h4.bad{color:var(--red);}
.st-review-block ul{margin:0;padding-left:18px;}
.st-review-block li{font-size:13.5px;line-height:1.55;margin-bottom:5px;}
.st-review-block p{font-size:13.5px;line-height:1.6;margin:0;}
.st-review-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.st-review-stage{font-size:13px;line-height:1.5;padding:7px 0;border-bottom:1px solid var(--line);}
.st-holat{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.04em;padding:2px 7px;
  border-radius:20px;margin-right:8px;text-transform:uppercase;}
.st-holat.yaxshi{background:rgba(47,191,113,.15);color:#1a7a45;}
.st-holat.ortacha{background:rgba(255,186,55,.18);color:#9a6b00;}
.st-holat.otkazibyuborildi{background:rgba(255,77,77,.13);color:#b91c1c;}
.st-review .st-finish{width:100%;margin-top:6px;}

@media(max-width:820px){
  .st-body{grid-template-columns:1fr;}
  .st-mobile-tabs{display:flex;}
  .st-chat.hide,.st-monitor.hide{display:none;}
  .st-chat.show,.st-monitor.show{display:flex;}
  .st-monitor{border-left:0;}
  .st-row{max-width:92%;}
  .st-review-cols{grid-template-columns:1fr;}
}
`;
