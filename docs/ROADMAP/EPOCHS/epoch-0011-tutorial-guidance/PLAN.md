# Epoch 0011 – Contextual tutorial and guidance system

**Parent Project:** King’s Canvas  \
**Epoch ID:** epoch-0011-tutorial-guidance  \
**Branch:** `epoch-0011-tutorial-guidance`  \
**Status:** In Planning

---

## 🎯 Overview

Students currently enter the Canvas without any in-product explanation of key
concepts like the persona selector, intentions, suggested steps, and
opportunities. This epoch introduces a contextual, event-driven tutorial that
uses lightweight callouts to orient students at key moments without blocking
their flow.

---

## ✅ Objectives

- Add a contextual, event-driven tutorial layer using tooltip-style callouts
  with optional dimming.
- Ensure tutorial state is stored per user in the database so it follows them
  across devices.
- Drive all tutorial copy from a single JSON file so it is easy to edit later.
- Keep the tutorial non-blocking, with options to skip all tips or defer a
  specific hint.

---

## 📦 Scope

- Introduce a tutorial messages JSON config file and type-safe loader.
- Add a client-side tutorial manager and callout UI that can anchor to key
  elements.
- Persist tutorial state per user in Mongo and expose a small API to update it.
- Wire in the specific moments:
  - Persona selector intro
  - First intention creation
  - First suggested steps for an intention
  - First opportunities view
  - Shuffle control in the opportunities modal
- Basic accessibility and visual polish for the callouts.

---

## 🚫 Out of Scope

- Changes to the Debug Panel.
- Persona-specific tutorial copy.
- Any real King’s Edge API integration for opportunities.

---

## 🔗 Planned PR Breakdown

- PR 0011 01: Tutorial copy JSON and loader (no UI yet).
- PR 0011 02: Client tutorial manager and generic callout component (local only).
- PR 0011 03: Persisted tutorial state per user.
- PR 0011 04: Wire real Canvas events to tutorial moments.
- PR 0011 05: Accessibility and visual polish.
