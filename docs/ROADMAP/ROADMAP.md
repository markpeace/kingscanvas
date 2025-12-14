# Roadmap — Lumin

This roadmap charts the delivery path for **Lumin**, organised into numbered epochs. Each epoch ships a user-visible slice while keeping documentation and observability aligned.

Detailed implementation plans for active epochs live under `/docs/ROADMAP/EPOCHS/<epoch-slug>/`.

---

## 🧭 Overview

- **Product Vision:** Provide Luminary workspaces that surface Core Knowledge, conversational guidance, and context-aware tools in a transparent, inspectable way.
- **Approach:** Ship incrementally through tightly scoped epochs, keeping documentation, state, and UX in sync at every milestone.

## 🧠 Core Knowledge work

- **Status:** Core Knowledge lab v1 (epoch-0012-core-knowledge-lab) is complete. Pirate Captain now runs on behavioural Core Knowledge (crewProfile, strategy, voyageLog) with reflection updating structured state, and Personal Trainer intake seeds profile/goals/context/plan/progress with behavioural metadata and aiExtendable guards. Evaluation scripts live in `docs/EVAL/core-knowledge-lab.md`.
- **Now possible:** Behaviour-driven conversations that stay in narrative/world-state or coaching tone; reflection writes into structured Core Knowledge with proactive elicitation for missing constraints.

### Next
- Expand behavioural Core Knowledge to additional Luminaries.
- Add plan/progress visualisations for Core Knowledge-driven plans.
- Support richer goal types and constraint handling.

---

## 📅 Epoch Timeline

### ✅ Epoch 0001 — Foundation and Scaffolding
_Status: Completed._

Established the initial Lumin shell, baseline navigation, and guardrails for environment setup so later epochs can layer features safely.

---

### ✅ Epoch 0002 — Canvas Layout and Interaction Basics
_Status: Completed._

Delivered the first Luminary workspace layout, including navigation affordances, panel scaffolding, and interaction patterns for subsequent data and AI features.

---

### ✅ Epoch 0003 — Data Plumbing and Persistence
_Status: Completed._

Introduced storage foundations, schema conventions, and persistence hooks to enable Luminary state to be loaded and saved predictably.

---

### ✅ Epoch 0004 — Observability and Debugging Hooks
_Status: Completed._

Added debug panels, logging conventions, and visibility toggles so developers can trace Luminary behaviour while building new capabilities.

---

### ✅ Epoch 0005 — Luminary Prompt Wiring
_Status: Completed._

Connected prompt flows into the Luminary workspace with consistent wiring, ensuring core interactions and debugging affordances function end to end.

---

### 🚧 Epoch 0007 — Shared LangGraph Path (No Tools, No Reflection)
_Status: Planned — not started._

- Unify the LangGraph path used by all Luminary runs while keeping user-visible behaviour equivalent to Epoch 0005.
- Keep tools and reflection disabled to stabilise the shared path before layering new behaviours.
- Ensure prompt inputs, context injection, and logging stay consistent across runs.

**Outcome:** A single, stable LangGraph path that mirrors Epoch 0005 behaviour from the user’s perspective and is ready for additional capabilities.

---

### 🚧 Epoch 0008 — Core Knowledge Schema Plumbing and Storage
_Status: Planned — not started._

- Define and validate a `coreKnowledge` schema scoped by `(userId, luminaryId)`.
- Persist Core Knowledge as a collection and load it into the graph as read-only context for each run.
- In the UI:
  - Add a small developer view in each Luminary workspace that shows the current Core Knowledge JSON for that user.
  - Add a simple read-only “Core Knowledge summary” card in each Luminary workspace that surfaces one or two key fields (for example name and a couple of profile or state facts) in a human-friendly way. This card is intentionally not the full schema-driven dashboard system and is dev oriented.
- Debug Panel:
  - Shows whether Core Knowledge exists for the current Luminary and user.
  - Shows creation and last read timestamps.
  - Shows a compact preview of the Core Knowledge document.

**Outcome:** Core Knowledge exists as a first-class data model wired into the graph, is read only, and can be inspected both as raw JSON and via a small summary card in the workspace.

---

### 🚧 Epoch 0009 — Reflection v1
_Status: Planned — not started._

Introduce a lightweight reflection step that summarises recent Luminary activity and highlights issues, without altering graph flow or invoking tools.

**Outcome:** Basic reflection summaries appear alongside runs to aid debugging and iteration.

---

### 🚧 Epoch 0010 — Reflection v2
_Status: Planned — not started._

Expand reflection with richer context capture, prioritisation of follow-ups, and clearer visibility in the workspace while keeping actions read only.

**Outcome:** Reflection insights become actionable guidance for subsequent prompts without direct mutation of state.

---

### 🚧 Epoch 0011 — Dashboards v1 (Schema-Driven Display)
_Status: Planned — not started._

Render schema-driven dashboard panels that surface Core Knowledge and run metadata in a consistent layout using existing bindings.

**Outcome:** Users can view structured Luminary and Core Knowledge data in-dashboard without interaction controls.

---

### 🚧 Epoch 0012 — Dashboards v2 (Visibility and Roles)
_Status: Planned — not started._

Layer visibility rules, role-aware sections, and more flexible layouts onto the dashboard system while keeping schema-driven rendering intact.

**Outcome:** Dashboards respect role-based visibility and layout needs across Luminary workspaces.

---

### 🚧 Epoch 0013 — Dashboards v3 (Interactive Buttons)
_Status: Planned — not started._

Add simple interactive buttons and actions to dashboards, enabling controlled user interactions without introducing full toolchains.

**Outcome:** Dashboards support light interactivity while adhering to schema and visibility rules.

---

### ✅ Epoch 0010 — Prompt Refinement and AI Architecture
**Status:** Completed. ([STATUS](./EPOCHS/0010-prompt-refinement/STATUS.yaml))

**Outcome:** Tooling hooks are available in the graph with auditing and safety controls.

---

### 🧭 Epoch 0011 — Contextual tutorial and guidance system
**Status:** In planning. ([PLAN](./EPOCHS/epoch-0011-tutorial-guidance/PLAN.md))

Add a contextual, event-driven tutorial with JSON-driven copy, tooltip-style callouts, and per-user state in the database so students can pick up guidance across devices without blocking their flow.

---

## 🧩 Supporting Workstreams

Expand tool coverage with validation steps, confirmation prompts, and rollback strategies to ensure safe execution.

**Outcome:** Tools operate with stronger correctness checks and user confirmations.

---

### 🚧 Epoch 0016 — Tidy Up and Production Hardening
_Status: Planned — not started._

Consolidate learnings from earlier epochs, close documentation gaps, refine observability, and harden the system for production readiness.

**Outcome:** The Luminary experience is stable, observable, and ready for broader rollout.
