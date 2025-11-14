# Epoch 0008 – Opportunity AI Simulation

**Parent Project:** King’s Canvas  \
**Epoch ID:** 0008  \
**Branch:** `feature/epoch-0008/opportunity-ai-simulation`  \
**Status:** In Progress

---

## 🧭 Overview

Build on the Opportunity model and UI introduced in Epoch 0007 by layering in AI-driven generation of fictional King’s Edge style opportunities. Each real step should surface a focused set of simulated opportunities without manual seeding while preserving the existing badge and modal experiences.

---

## 🎯 Objectives

- Automatically generate opportunities exactly once when:
  - A student manually creates a step.
  - A student accepts an AI suggested step and it becomes a real step.
- Provide a “Shuffle opportunities” action on real steps that regenerates recommendations on demand.
- Ensure ghost AI suggestions never trigger opportunity generation or display opportunity UI.

---

## 🗂️ Scope

- Implement an AI workflow that produces three to four fictional opportunities per eligible step (two to three `edge_simulated`, one `independent`).
- Add backend helpers and an endpoint that generate or shuffle opportunities for a given step.
- Hook step creation and AI step acceptance into the generation workflow for first-time opportunity creation.
- Extend the UI with a shuffle control that calls the backend shuffle endpoint and refreshes the badge plus modal content.

---

## 🚫 Out of Scope

- Connecting to real King’s Edge data sources or APIs.
- Allowing students to manually edit or curate individual opportunities.
- Modifying the intention or step data models beyond what Epoch 0007 delivered.

---

## 🔗 Dependencies

- Requires Epoch 0007 — Opportunities Model and UI — to remain intact, including persistence, API surface, and badge/modal presentation layers.

---

## ⚠️ Risks & Considerations

- Generated content must stay aligned with King’s Edge ethos to avoid confusing students with implausible opportunities.
- AI generation should be scoped to real steps to control token usage and avoid unnecessary costs.
- Shuffle behaviour must maintain UI responsiveness and loading states introduced in Epoch 0007.

---

## 📏 Measuring Success

- Newly created or accepted steps surface a concise set of simulated opportunities without manual intervention.
- Shuffle regenerates opportunities reliably and updates the badge plus modal without regressions.
- Ghost AI suggestions remain free of opportunity badges, modals, and background generation.
