# Epoch 0010 – Prompt Refinement and AI Architecture

**Parent Project:** King’s Canvas  \
**Epoch ID:** 0010  \
**Branch:** `feature/epoch-0010/prompt-refinement`  \
**Status:** In Progress

---

## 🎯 Overview

Rebuild and refine the AI layer so prompts are consolidated, editable, and
context-aware while every AI response is transparent about the model used. The
work centres on making AI outputs observable and trustworthy, enforcing explicit
LLM selection, and aligning prompts with King’s Edge pedagogy and learning
architecture.

---

## ✅ Objectives

- **LLM model control & observability:** A single `LLM` environment variable must
  determine the model with no fallbacks. Missing values should surface as a
  visible Debug Panel error, and every AI response must carry `{ model: "<which
  LLM was used>" }` for the frontend and Debug Panel.
- **Step generation prompt:** Consolidate the full step-generation prompt into a
  single source (e.g., `lib/prompts/steps.ts`). The prompt should be fully
  generative, produce concise steps for knowledge, skills, and experience, and
  respect intention buckets plus programme (UG/Masters/PhD) and study mode
  (on-campus/distance).
- **Opportunity generation prompt:** Introduce a distinct prompt file (e.g.,
  `lib/prompts/opportunities.ts`) that generates opportunity *types* aligned to
  King’s Edge tiers (Intensive, Sustained, Short, Evergreen), maps steps to
  blueprint categories, adapts to student constraints, and replaces the
  deterministic `lib/opportunities` engine.
- **Context collection & integration:** Capture course/discipline, year of study,
  programme type, and study mode, then pass them UI → API → workflow → prompt so
  prompts adapt to each student’s context.
- **Debugging architecture:** Ensure every PR includes Debug Panel instructions
  and that the panel consistently shows model provenance, configuration errors,
  and final AI-generated text, with optional full prompt visibility when
  needed.
- **Development workflow:** Plan a small set of focused PRs to add model
  provenance to suggestion payloads, enforce `LLM` usage, extract and refine the
  step and opportunity prompts, add UI context selectors, integrate context into
  prompts, and replace the deterministic opportunity engine with the AI-driven
  flow.

---

## 📦 Scope

- Enforce explicit model selection via `LLM` with observable errors when absent.
- Return model provenance alongside all AI outputs for frontend and Debug Panel
  display.
- Centralise the step-generation prompt in one editable file that adapts to
  intention buckets, programme type, and study mode.
- Create an opportunity-generation prompt file that produces tiered opportunity
  types, maps to blueprint categories, and replaces the deterministic engine.
- Collect and thread core student context fields from UI through prompts so AI
  guidance personalises appropriately.
- Document Debug Panel expectations so each PR preserves transparent AI
  behaviour.

---

## 🚫 Out of Scope

- Shipping live King’s Edge API integrations (remains with Epoch 0009 planning).
- Changing application runtime behaviour beyond what is required to describe and
  plan the prompt and observability work.
- Introducing new default models or fallback behaviours for AI flows.

---

## ⚠️ Risks & Considerations

- Enforcing a single `LLM` variable may surface configuration gaps that need
  coordinated fixes across environments.
- Consolidated prompts must stay maintainable and discoverable for future
  iterations while avoiding regressions to deterministic opportunity logic.
- Context capture and Debug Panel visibility should avoid leaking sensitive data
  while still providing actionable observability.

---

## 🧠 One-Sentence Summary

Build a transparent, context-aware AI guidance engine with explicit model
control, consolidated prompts, and full Debug Panel visibility aligned to King’s
Edge learning pathways.
