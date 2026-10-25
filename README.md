# ProjectX — AI Practical / Lab Report Builder

> **Lab reports, done before the coffee cools.**  
> Type a practical title, drop your screenshots, get a submission-ready `.docx` in exact college format in ~30 seconds.

**Live Demo:** [projectx.landing.iamanish.in](https://projectx.landing.iamanish.in/) · **App:** [projectx.iamanish.in](https://projectx.iamanish.in/)

[![Live](https://img.shields.io/badge/Live-Demo-brightgreen)](https://projectx.iamanish.in/)
[![Tech](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Prisma%20%7C%20Gemini-blue)](#tech-stack)
[![License](https://img.shields.io/badge/License-MIT-yellow)](#)

---

## 🎯 Project Overview (Resume Summary)

**ProjectX** is a full-stack AI product that turns scattered screenshots + a practical title into a polished, college-formatted lab report (`.docx` + optional PDF) in under a minute.

It solves a real pain point for B.Tech students: hours spent formatting headers, PRN footers, page numbers, screenshot placement, and writing procedure text. ProjectX automates the entire pipeline with Gemini vision + structured generation and a custom DOCX template engine.

### Key Engineering Highlights for Recruiters

- **End-to-end product ownership** — from idea → production (auth, payments, AI pipeline, document generation, deployment)
- **Multimodal AI pipeline** — Gemini analyzes screenshots + title → structured JSON procedure → DOCX builder
- **Credit-based monetization** with Razorpay (orders, webhooks, atomic credit deduction + refund on failure)
- **Production-grade document generation** — college header/footer, precise margins, screenshot placement, section toggles, Power Mode smart image mapping
- **Type-safe backend** with Prisma + PostgreSQL, JWT + Google OAuth, rate limiting, file cleanup
- **Modern frontend** — React 19 + TypeScript + Vite + Tailwind, Google OAuth, smooth UX

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Smart Context Merging** | Gemini stitches screenshots + title into a coherent, step-by-step procedure automatically |
| **Precision College Formatting** | Exact headers, PRN footers, margins, page numbers, college logo — template-driven |
| **Integrated Visuals** | Auto ordering, captions, borders; Power Mode for intelligent screenshot-to-step matching |
| **Extensible Templates** | Centralized template engine — any college / subject / format |
| **Auth** | Email/password + Google OAuth |
| **Credits & Payments** | Credit system (10 credits = 1 report), Razorpay integration, plans, webhooks |
| **Section Control** | Toggle Aim, Objectives, Steps, Architecture, Verification, Conclusion, custom sections |
| **Output** | Submission-ready `.docx` + optional PDF conversion |
| **Safety** | Atomic credit deduction, automatic refund on generation failure, temp file cleanup |

---

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  React Frontend │────▶│  Express Backend     │────▶│  Gemini (Vision +   │
│  (Vite + TS)    │     │  (Node.js)           │     │   Text Generation)  │
│                 │     │                      │     └─────────────────────┘
│  Google OAuth   │     │  • Auth (JWT)        │
│  File Upload    │     │  • Document Service  │     ┌─────────────────────┐
│  Razorpay UI    │     │  • DocBuilder        │────▶│  PostgreSQL         │
└─────────────────┘     │  • GeminiBuilder     │     │  (Prisma ORM)       │
                        │  • Razorpay Webhooks │     └─────────────────────┘
                        └──────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  DOCX (docx lib)     │
                        │  + optional PDF      │
                        │  (libreoffice)       │
                        └──────────────────────┘
```

**Flow**
1. User uploads screenshots + enters practical title / meta (Name, PRN, Faculty, etc.)
2. Backend deducts credits atomically
3. GeminiBuilder sends images + structured prompt → Gemini returns strict JSON (aim, objectives, steps, architecture, verification, conclusion…)
4. DocBuilder renders college-formatted DOCX with screenshots placed correctly
5. Optional PDF conversion → file served for download
6. On any failure → credits are refunded

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Lucide, Lenis, Google OAuth |
| **Backend** | Node.js, Express, Prisma 6, PostgreSQL |
| **AI** | Google Gemini (vision + structured generation) |
| **Document Gen** | `docx` library (custom template engine), `libreoffice-convert` (PDF), `sharp` |
| **Auth** | JWT + bcrypt, Google OAuth (`google-auth-library`) |
| **Payments** | Razorpay (orders + webhooks) |
| **Validation** | Zod |
| **Testing** | Jest + Supertest |
| **Deployment** | Frontend (Vercel), Backend (Render / Docker) |

---

## 📁 Project Structure

```
project-practical-/
├── Backend/
│   ├── DocBuilder/          # Custom DOCX template engine (components, layout, headers/footers)
│   ├── GeminiBuilder/       # Prompt engineering + Gemini API + JSON normalizer
│   ├── prisma/              # Schema, migrations, seed
│   ├── src/
│   │   ├── controllers/     # Auth, Document, Payment, Section, Template, Stats
│   │   ├── services/        # Business logic (document, docBuilder, auth, Razorpay, gemini)
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── server.js
│   ├── public/templates/    # Template previews
│   ├── Dockerfile
│   └── package.json
├── Frontend/
│   ├── src/                 # React app (workspace, auth, payments, history)
│   ├── public/
│   └── package.json
└── .github/workflows/       # CI (if configured)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (local or Supabase / Neon)
- Gemini API key
- (Optional) Razorpay keys for payments
- (Optional) LibreOffice for PDF conversion

### 1. Clone
```bash
git clone https://github.com/anishkumar0504/project-practical-.git
cd project-practical-
```

### 2. Backend
```bash
cd Backend
cp .env.example .env          # fill DATABASE_URL, GEMINI_API_KEY, JWT_SECRET, etc.
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed           # optional — plans & templates
npm run dev                   # http://localhost:5000 (or your PORT)
```

### 3. Frontend
```bash
cd Frontend
cp .env.example .env          # set VITE_API_URL, Google client ID if needed
npm install
npm run dev                   # http://localhost:5173
```

### Environment Variables (Backend)
```env
DATABASE_URL=
DIRECT_URL=
GEMINI_API_KEY=
JWT_SECRET=
GOOGLE_CLIENT_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
PORT=5000
NODE_ENV=development
```

---

## 📊 Database Models (Prisma)

- **User** — email / Google auth, credits, role
- **Plan** — credit packs + pricing
- **Order** — Razorpay orders + payment status
- **Session** — JWT sessions
- **Template** — college templates (slug, sections, default meta/layout)
- **Document** — generated reports (meta, sections, status, output path)

---

## 🔒 Security & Reliability

- Atomic credit deduction (`updateMany` with `credits >= cost`)
- Automatic credit refund on generation failure
- Temp file cleanup after success/failure
- Rate limiting on sensitive routes
- Prompt injection resistance (screenshots/reference treated as data only)
- No personal identifiers (emails, keys, IPs) copied from screenshots into output

---

## 📈 Live Stats (from landing)

- 50+ registered users  
- 100+ documents generated  
- 50+ successful orders  
- 1000+ AI credits used  

---

## 🧪 Testing

```bash
cd Backend
npm test                  # Jest + Supertest
npm run test:watch
```

---

## 👨‍💻 Author

**Anish Kumar**  
GitHub: [@anishkumar0504](https://github.com/anishkumar0504)

This project demonstrates end-to-end ownership of a modern AI SaaS product: multimodal generation, document engineering, payments, auth, credit systems, and production deployment.

---

## ⭐ Support

If you find ProjectX useful, consider starring the repository — it helps others discover it!
```