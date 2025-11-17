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

### ✅ Epoch 0006 — Roadmap and UX Refresh
**Status:** Completed. ([PLAN](./EPOCHS/0006-roadmap-ux-refresh/PLAN.md))

Delivered: Synced STATE and ROADMAP artefacts, refreshed changelog coverage,
and shipped Canvas UX polish across layout, modals, saving feedback, and
drag-and-drop cues informed by Epoch 0005 learnings.

---

### ✅ Epoch 0007 — Opportunities Model and UI
**Status:** Completed. ([STATUS](./EPOCHS/0007-opportunities-model-ui/STATUS.yaml))

- **Model:** Opportunity entity linked to steps with source, form, focus, and status metadata.
- **Storage & API:** Persistence layer and `GET /api/steps/[stepId]/opportunities` endpoint for read-only access.
- **UI:** Opportunity badges on real step cards and a modal with loading, empty, and populated states. Ghost AI suggestions intentionally omit opportunity UI.

---

### ✅ Epoch 0008 — Opportunity AI Simulation
**Status:** Completed. ([STATUS](./EPOCHS/0008-opportunity-ai-simulation/STATUS.yaml))

- Shipped simulated King’s Edge style opportunities for every real step, with eligibility rules scoped to manual and accepted AI steps.
- Added shuffle controls and API support so students can refresh suggestions on demand.
- Updated the ear badge and modal UI to show counts plus Edge vs independent groupings with reliable scrolling and controls.
- Hardened the flow with structured logging, error handling, and tests covering the generator, eligibility, and endpoints.

---

### 🧠 Epoch 0009 — Future Real Edge Integration
**Status:** In planning.

Connect to real King’s Edge data sources, handle secure data exchange, and graduate the simulated opportunity experience into production-ready integrations once data governance clears the path.

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
