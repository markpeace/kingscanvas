# Roadmap — King’s Canvas

This roadmap outlines the development epochs for **King’s Canvas**. Each epoch is a focused, user-visible slice that moves the product closer to the long-term vision: helping King’s College London students map intentions, actionable steps, and real-world opportunities.

Detailed implementation plans for each epoch live under `/docs/ROADMAP/EPOCHS/<epoch-slug>/`.

---

## 🧭 Overview

- **Product Vision:** Students use King’s Canvas to design their life journey, breaking intentions into steps and connecting them to actionable opportunities.
- **Approach:** Ship incrementally through tightly scoped epochs, keeping documentation, state, and UX in sync at every milestone.

---

## 📅 Epoch Timeline

### ✅ Epoch 0001 — Canvas Columns and Layout
**Status:** Completed.

Established the four-column Canvas layout (Do Now / Do Later / Before I Graduate / After I Graduate), applied King’s branding and accessibility foundations, and delivered a responsive static prototype for review.

---

### ✅ Epoch 0002 — Intentions, Steps and Swim Lanes
**Status:** Completed.

Added CRUD flows, drag-and-drop swim lanes, card styling, accessibility affordances, and feedback toasts so students can manage intentions and steps interactively.

---

### ✅ Epoch 0003 — Authentication and Session Handling
**Status:** Completed.

Implemented Google OAuth via NextAuth, route guards, session UI, and local/preview bypasses to secure the Canvas while supporting rapid iteration.

---

### ✅ Epoch 0004 — Persistence and Autosave
**Status:** Completed.

Connected the Canvas to MongoDB with autosave, background sync reliability, and debug instrumentation so edits persist automatically across sessions.

---

### ✅ Epoch 0005 — LangGraph AI Step Suggestions
**Status:** Completed.

Integrated LangGraph workflows to generate suggested steps, added prompt builder iterations, and refined the UX for reviewing, accepting, or rejecting AI-generated steps.

---

### 🚧 Epoch 0006 — Roadmap and UX Refresh
**Status:** In progress. ([PLAN](./EPOCHS/0006-roadmap-ux-refresh/PLAN.md))

- Realign `/docs/STATE/CURRENT.yaml` and `/docs/ROADMAP/ROADMAP.md` so STATE accurately reflects the live roadmap.
- Apply light UX and layout polish across the Canvas to incorporate feedback gathered during Epoch 0005.
- Capture updated scope and status via `/docs/ROADMAP/EPOCHS/0006-roadmap-ux-refresh/STATUS.yaml`.

---

### 🧩 Epoch 0007 — Opportunities Model and UI
**Status:** Planned.

Define the opportunities domain model, persist opportunities alongside intentions and steps, and surface an initial opportunities panel within the Canvas.

---

### 🧠 Epoch 0008 — AI Simulated Edge Opportunities
**Status:** Planned.

Use simulated King’s Edge-style data with LangGraph and RAG techniques to generate, rank, and explain opportunity matches against student plans.

---

### 🌐 Epoch 0009 — Future Real Edge Integration
**Status:** Planned (not yet scheduled).

Connect to real King’s Edge data sources, handle secure data exchange, and graduate the simulated opportunity experience into production-ready integrations.

---

## 🧩 Supporting Workstreams

Ongoing parallel streams ensure each epoch ships responsibly:

- **Brand & UX Alignment:** Continual collaboration with King’s Brand and Marketing for visual consistency.
- **Accessibility (WCAG AA+):** Verification and remediation alongside each feature shipment.
- **Security & GDPR:** Privacy and compliance reviews for authentication, data storage, and AI workflows.
- **Documentation & Observability:** Keep `/docs/STATE/`, `/docs/ROADMAP/`, and debug tooling up to date as functionality evolves.

---

## ✅ Definition of Done (MVP)

The King’s Canvas MVP is complete when:

1. Students can authenticate, create, and manage a persistent Canvas.
2. AI workflows generate, match, and explain suggestions with actionable insights.
3. Opportunity discovery and conversational coaching are available, brand-compliant, and accessible.
4. The platform is production-ready, observability is in place, and compliance requirements are satisfied.
