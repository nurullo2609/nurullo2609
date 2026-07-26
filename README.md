# Sotuv Trenajyori

Sotuv menejerlarini o'rgatuvchi jonli trenajyor. Chapda AI-mijoz bilan suhbat, o'ngda 9 bosqichli progress, jonli ball va qizil bayroqlar. Model: `claude-sonnet-4-6` (backend orqali, kalit yashirin).

## Nima uchun backend kerak?

API kalitni frontendga qo'yish xavfli — uni har kim ko'radi va ishlatadi. Shuning uchun kalit **Netlify Function** (`netlify/functions/claude.js`) ichida, server tomonda saqlanadi. Frontend faqat `/api/claude` ga murojaat qiladi.

---

## Deploy qilish (Netlify) — 5 qadam

### 1. Kodni GitHub'ga yuklang
Ushbu papkani yangi GitHub repozitoriyasiga push qiling:
```bash
git init
git add .
git commit -m "Sotuv trenajyori"
git branch -M main
git remote add origin https://github.com/FOYDALANUVCHI/trenajyor.git
git push -u origin main
```

### 2. Netlify'da yangi sayt
netlify.com → **Add new site → Import an existing project** → GitHub → reponi tanlang.
Build sozlamalari `netlify.toml` dan avtomatik o'qiladi (build: `npm run build`, publish: `dist`).

### 3. API kalitni qo'shing (ENG MUHIM QADAM)
Netlify saytingizda: **Site settings → Environment variables → Add a variable**
- Key: `ANTHROPIC_API_KEY`
- Value: kalitingiz (`sk-ant-...`)

Kalitni bu yerdan olasiz: https://console.anthropic.com → API Keys.

(Ixtiyoriy) Yangi/arzonroq model uchun yana bitta o'zgaruvchi:
- Key: `CLAUDE_MODEL`  →  Value: `claude-sonnet-5`

### 4. Deploy
**Deploys → Trigger deploy** (yoki har git push avtomatik deploy qiladi).

### 5. Tayyor
Netlify beradigan havolani (masalan `sotuv-trenajyori.netlify.app`) jamoaga tarqating. O'z domeningizni ulash: **Domain settings → Add custom domain**.

---

## Lokal test (ixtiyoriy)

```bash
npm install
npm install -g netlify-cli
cp .env.example .env      # .env ichiga kalitni yozing
netlify dev               # http://localhost:8888
```

> `npm run dev` (oddiy Vite) faqat interfeys uchun — `/api/claude` funksiyasi ishlashi uchun `netlify dev` kerak.

---

## Fayllar

```
├── index.html                    Vite kirish nuqtasi
├── netlify.toml                  Build + /api redirect
├── package.json
├── vite.config.js
├── src/
│   ├── App.jsx                   Trenajyor (chat + panel + 2 API chaqiruv)
│   ├── main.jsx
│   └── index.css
└── netlify/functions/
    └── claude.js                 API proksisi (kalit shu yerda yashirin)
```

## Xavfsizlik eslatmasi
Bu proksi ochiq — havolaga ega har kim so'rov yuborishi mumkin (Anthropic hisobingiz hisobidan). Jamoa ichida ishlatish uchun yetarli. Ochiq internetga qo'ysangiz, foydalanishni cheklash uchun oddiy parol yoki Netlify Identity qo'shishni o'ylab ko'ring.
