# Epoch 0008 – Opportunity AI Simulation

**Parent Project:** King’s Canvas  \
**Epoch ID:** 0008  \
**Branch:** `feature/epoch-0008/opportunity-ai-simulation`  \
**Status:** Completed

---

## 🎯 Overview

Build on the Opportunity model, storage, and UI delivered in Epoch 0007 by
introducing AI-generated, fictional King’s Edge style opportunities for real
steps. This epoch keeps the existing badge and modal while layering in
automatic generation, regeneration, and safeguards against surfacing data for
ghost AI suggestions.

---

## ✅ Objectives

- Automatically generate a small set of fictional opportunities (3–4 total) for
  every real step when:
  - A student manually creates a step.
  - A student accepts an AI suggested step and it becomes a real step.
- Provide a “Shuffle opportunities” control on real steps so students can
  regenerate recommendations on demand.
- Ensure ghost AI suggestions never trigger opportunity generation and never
  display opportunity UI affordances.
- Produce opportunities entirely from fictional content in the spirit of
  King’s Edge without calling live King’s Edge APIs.

---

## 📦 Scope

- Add an AI workflow that produces 3–4 structured opportunities per step
  (targeting 3 `kings-edge-simulated` and 1 `independent`).
- Implement backend helper logic plus an endpoint to generate or shuffle
  opportunities for a given step.
- Trigger automatic opportunity generation from:
  - Manual step creation flows.
  - Acceptance of AI suggested steps.
- Surface a shuffle control in the existing UI that calls the shuffle endpoint
  and refreshes both the badge count and modal contents.

---

## 🚫 Out of Scope

- Integrating with real King’s Edge data sources or APIs.
- Allowing students to manually CRUD individual opportunities beyond the
  shuffle affordance.
- Modifying intention or step data models outside of what is necessary to store
  generated opportunities.
- Redesigning the opportunities badge or modal beyond minimal changes required
  to support shuffle behaviour.

---

## 🔗 Dependencies

- Successful delivery of Epoch 0007 – Opportunity Model and UI, including the
  persisted opportunity records, read-only API, and badge/modal presentation for
  real steps.

---

## ⚠️ Risks & Considerations

- Managing AI latency and token usage so step creation flows remain responsive.
- Guaranteeing that ghost AI suggestions never trigger generation or surface
  opportunities.
- Keeping manual step creation resilient when AI generation fails, including
  sensible fallbacks or retries.

---

## ✅ Outcome (2025-11-15)

- Generated fictional King’s Edge style opportunities automatically for every
  real step (manual or accepted AI) while ghost suggestions stayed untouched.
- Introduced shuffle controls backed by `POST /api/steps/[stepId]/opportunities/shuffle`
  plus existing read endpoint so badges and modals always reflect the latest
  suggestions.
- Updated the ear badge and Opportunities modal to show counts, Edge vs
  independent groupings, shuffle, close, and viewport-safe scrolling.
- Added structured logging and unit/integration tests that cover generator
  prompts, eligibility checks, and both API surfaces to keep the flow stable.
- Documented the deliberate decision to keep all content simulated until Epoch
  0009 delivers real King’s Edge integrations and copy refinements.
