# Architecture Specification — King’s Canvas

---

## 1. Overview

King’s Canvas is a browser-based life-design platform built for desktop use. It consists of a client-heavy architecture with real-time interactions and a background matching engine that surfaces contextual opportunities to students based on their life plans.

This document outlines the core system components, how data flows between them, and where AI and live data enrichment fit into the overall architecture.

---

## 2. High-Level Architecture

```
┌────────────────────┐
│     Frontend       │  React + Tailwind (desktop only)
└────────┬───────────┘
         │ GraphQL / REST API
         ▼
┌────────────────────┐
│     Backend API     │  Node.js / Express or Serverless
│ - Intention & Step CRUD
│ - Opportunity matcher trigger
│ - AI prompt routing
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│     Database        │  PostgreSQL (via Supabase or Prisma)
│ - Students, Intentions, Steps
│ - Tags, Linked Opportunities
│ - Match history, AI memory
└────────────────────┘

         ▲
         │
┌────────┴────────────┐
│  AI Services (LLMs) │  OpenAI / embedding store
│ - Step suggestion
│ - Opportunity ranking
│ - Chat support + explanation
└─────────────────────┘

         ▲
         │
┌────────┴────────────┐
│Opportunity Catalogs │  Indexed from King’s Edge & partners
│ - Workshops, modules, events
│ - Real-time matching against Steps
└─────────────────────┘
```

---

## 3. Key Components

### 🖥 Frontend (React)
- Desktop-only SPA with drag-and-drop canvas interface.
- Four “time buckets”: Do Now, Do Later, Before I Graduate, After I Graduate.
- Renders Intentions and Steps as draggable cards.
- Shows live opportunity badge counts on each Step card.
- Connects to AI chat assistant (optional).
- Pulls in opportunity suggestions from API.

### 🌐 Backend (API Layer)
- Manages user auth and session.
- CRUD endpoints for:
  - Intentions
  - Steps
  - Tags
  - Linked Opportunities
- Triggers AI workflows:
  - Step generation
  - Opportunity refresh
  - Opportunity rejection memory
- Exposes secure endpoints to save AI interaction history.

### 🧠 AI Services
- Suggests Steps based on intention titles + context.
- Matches opportunities using:
  - Vector similarity (via tags/embeddings)
  - Eligibility rules (e.g., year/programme)
  - Timing and freshness
- Memory component:
  - Tracks rejected/snoozed items
  - Avoids repeat recommendations

### 🔍 Opportunity Matcher
- Scheduled or event-driven process.
- For each Step:
  - Extract tags (manual + AI)
  - Query indexed opportunity catalogs
  - Score/rank by relevance
  - Update Step badge count and suggestion list
- Uses hybrid filtering:
  - Eligibility filters
  - Semantic similarity via embeddings
  - Boosted recency/novelty

### 📚 Data Layer
- Stores all student data securely (per user):
  - Intentions
  - Steps
  - Tags
  - Linked and suggested opportunities
- Tracks:
  - Accept/reject/snooze actions
  - Match timestamps
  - AI decisions

---

## 4. Data Flow (Typical Usage)

1. Student adds a new Intention via UI or AI chat.
2. System suggests 2–4 Steps in buckets before the intention’s timeline.
3. Background job runs matcher on each Step.
4. Matches are stored and badge counts updated.
5. Student clicks Step badge → sees suggestions → Accept / Dismiss / Snooze.
6. Added Opportunities are shown inline on the Step card.

---

## 5. Tech Stack (Planned)

| Layer             | Technology (Draft)                    |
|------------------|----------------------------------------|
| Frontend          | React + TypeScript + TailwindCSS      |
| Backend           | Node.js / Express or serverless (tbd) |
| AI Layer          | OpenAI GPT-4 + embeddings             |
| Database          | PostgreSQL (via Supabase or Prisma)   |
| Search Indexing   | Pinecone / Redis Vector / pgvector    |
| Auth              | Supabase or Clerk.dev                 |

---

## 6. Security & Access Control

- Only authenticated students can edit their own canvas.
- No one can see another student’s data unless explicit sharing is added in future versions.
- All AI suggestions are stored with metadata (timestamps, decisions, prompt payload).
- GDPR-compliant data practices (right to delete, opt-
