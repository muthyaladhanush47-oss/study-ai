# StudyAI — AI Study Assistant

Upload PDF lecture notes and instantly get:

- **AI chat** grounded in your document (streaming responses with memory of your conversation)
- **Chapter-by-chapter summaries** with key points
- **Flashcard generator** with a flip-card deck
- **Quiz generator** with instant feedback and explanations
- **Mind maps** auto-generated from your notes
- **Handwriting OCR** for scanned / handwritten PDFs (page images transcribed by a vision model)
- User accounts (email + Google OAuth), private file storage, dark mode, fully mobile responsive.

The product is free and supported by Google AdSense ads on the landing, dashboard, and analytics pages.

---

## Tech stack

| Layer        | Technology                                        |
| ------------ | ------------------------------------------------- |
| Framework    | Next.js 16 (App Router, Turbopack) + TypeScript   |
| Styling      | Tailwind CSS v4 + shadcn/ui (Base UI) + tw-animate-css |
| Auth & Data  | Supabase (Auth, Postgres + RLS, Storage buckets)  |
| AI           | Google Gemini (official @google/genai SDK)      |
| PDF parsing  | pdf-parse + pdf-to-img (page rasterization for OCR) |
| Mind maps    | React Flow (@xyflow/react)                        |
| Hosting      | Vercel                                            |

---

## Project structure

```
├── proxy.ts                      # Session refresh + route protection
├── supabase/
│   └── migrations/
│       ├── 20250101000000_init.sql   # Base schema (documents, activities, RLS)
│       └── 20260201000000_upgrade.sql# OCR fields, profiles, chat_messages
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page (SEO + ads + FAQ)
│   │   ├── (auth)/               # login, signup, OAuth callback
│   │   ├── (app)/                # dashboard, analytics, profile, mindmap,
│   │   │                         #   chat/summaries/flashcards/quiz pages
│   │   └── api/
│   │       ├── upload/           # Upload PDF + extract text + scan detection
│   │       ├── ocr/              # Rasterize pages + transcribe via vision model
│   │       ├── documents/[id]/   # Document metadata + PDF streaming
│   │       ├── chat/             # Streaming chat with document context + memory
│   │       ├── chat/save/        # Bulk-persist chat messages
│   │       ├── summarize/        # Chapter summaries
│   │       ├── flashcards/       # Flashcard generation
│   │       ├── quiz/             # Quiz generation
│   │       ├── mindmap/          # Mind map generation
│   │       └── profile/          # Learner profile (GET/POST)
│   ├── components/               # UI kit + feature components
│   ├── lib/
│   │   ├── supabase/             # client / server / proxy helpers
│   │   ├── ai/                   # Gemini + vision OCR helpers
│   │   ├── gemini.ts             # Gemini chat + streaming client
│   │   ├── pdf.ts                # PDF text extraction + scan detection
│   │   ├── ocr.ts                # PDF page rasterization
│   │   ├── analytics.ts          # Dashboard stats + study streak
│   │   └── utils.ts              # cn(), formatters
│   └── types/                    # Shared TypeScript types
```

---

## 1. Local setup

### Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- A Supabase project
- A Gemini API key

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Find `SUPABASE_URL` and `ANON_KEY` under **Supabase Dashboard → Project Settings → API**.
> Create a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### Set up the database

1. Open your Supabase project → **SQL Editor**.
2. Run `supabase/migrations/20250101000000_init.sql` first, then
   `supabase/migrations/20260201000000_upgrade.sql`, then
   `supabase/migrations/20260807000000_study_sessions.sql`.
   Together they create the tables, enable Row Level Security, and create the private `documents` storage bucket with per-user policies. The upgrades add OCR fields, learner profiles, chat memory, and study-time tracking.

### Configure auth redirects (Supabase Dashboard → Authentication → URL Configuration)

Add to **Redirect URLs**:

```
http://localhost:3000/auth/callback
https://your-app.vercel.app/auth/callback
```

If you want Google sign-in, enable the **Google** provider under **Authentication → Providers** and add your client ID/secret.

> **Tip:** During development you can disable **"Confirm email"** under
> **Authentication → Providers → Email** so signup logs you straight in.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 2. How it works

1. **Upload** a PDF (`POST /api/upload`). The file is stored privately in the `documents` bucket at `{user_id}/{uuid}.pdf`, and the text is extracted with `pdf-parse`. If the page has little extractable text (`isLikelyScanned`), the document is flagged `needs_ocr` and the OCR runner modal kicks in.
2. **OCR** (`POST /api/ocr`) rasterizes each page with `pdf-to-img` and sends the images to the vision model (`GEMINI_VISION_MODEL`), which returns `=== PAGE n ===`-delimited transcriptions that are stored in `document_content`.
3. **Generate** summaries, flashcards, quizzes, or mind maps. Each route loads the user's own document content, builds a strict-JSON prompt, calls Gemini, and stores an entry in `study_activities`.
4. **Chat** streams tokens from Gemini straight to the browser through `POST /api/chat`. The assistant adapts its tone/approach to the learner profile, uses the document text as context, and remembers previous messages (persisted in `chat_messages`).
5. **Profile** (`/profile`) lets learners set a display name, learning level, and goal. The dashboard shows weekly study activity and a streak based on `study_activities`.

---

## 3. Deployment on Vercel

1. Push the repo to GitHub.
2. In the Vercel dashboard, **Add New Project** and import the repo.
   - Framework preset: **Next.js** (auto-detected).
3. Add the same environment variables from `.env.example` in **Settings → Environment Variables**.
4. Deploy. Vercel will automatically run `next build`.

> **Note on max duration:** The AI routes export `maxDuration = 300`.
> On Vercel's **Hobby** plan the hard limit is 60s for serverless functions; on **Pro** it is 300s.
> Streaming chat works well within these limits; for very long documents reduce
> `MAX_CONTEXT_CHARS` in `src/lib/pdf.ts` if you hit timeouts.

### Post-deploy checklist

- [ ] Add your production URL to Supabase **Redirect URLs** (`https://<app>.vercel.app/auth/callback`).
- [ ] Update `NEXT_PUBLIC_APP_URL` to your production URL.
- [ ] Run all three SQL migrations in the Supabase SQL Editor.
- [ ] Test signup, upload, OCR, and each AI feature.

---

## 4. Monetization (optional)

Set `NEXT_PUBLIC_AD_CLIENT` to your Google AdSense publisher ID (e.g. `ca-pub-1234567890123456`)
and optionally `NEXT_PUBLIC_GOOGLE_TAG` for Google Analytics. When the ad client is unset,
the ad slots render a subtle **Advertisement** placeholder instead, so the app works out of the box.

---

## 5. Configuration reference

| Env var                   | Required | Description                              |
| ------------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`| Yes      | Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key       |
| `GEMINI_API_KEY`          | Yes      | Google Gemini API key                    |
| `GEMINI_MODEL`            | No       | Chat model, default `gemini-2.5-flash`   |
| `GEMINI_VISION_MODEL`     | No       | OCR vision model, default `gemini-2.5-flash` |
| `NEXT_PUBLIC_APP_URL`     | No       | Canonical app URL (default localhost)    |
| `NEXT_PUBLIC_AD_CLIENT`   | No       | Google AdSense publisher ID              |
| `NEXT_PUBLIC_GOOGLE_TAG`  | No       | Google Analytics / Tag Manager ID        |

---

## 6. Customization ideas

- Try other Gemini models (e.g. `gemini-2.5-pro`) via `GEMINI_MODEL`.
- Add per-user limits/quotas using `study_activities`.
- Add PDF chapter detection before summarization.
- Let learners pick a preferred model or tutor persona from the profile page.
