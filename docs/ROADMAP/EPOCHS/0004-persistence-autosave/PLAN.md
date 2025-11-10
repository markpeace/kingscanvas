# Epoch 0004 — Persistence & Autosave

**Parent Project:** King’s Canvas  
**Epoch ID:** 0004  
**Branch:** `feature/epoch-0004/persistence-autosave`  
**Start Date:** 2025-11-10  
**Status:** In Progress  

---

## 🎯 Objective
Replace mock data flow with real MongoDB persistence and make every client/server operation observable through the built-in debug system.

---

## 🧩 Deliverables

| PR | Title | Purpose |
|----|--------|----------|
| 0001 | Plan Injection | Add this PLAN.md and set epoch active in state. |
| 0002 | Disable Mocking by Default | Turn off MSW in all environments unless explicitly enabled and `VERCEL_ENV=development`. |
| 0003 | Extend MongoDB Utilities | Build `lib/dbHelpers.ts` and `lib/userData.ts` on top of `lib/mongodb.ts`; instrument with `debug.trace`. |
| 0004 | CRUD API Routes | Implement `/api/intentions` and `/api/steps`; full debug logging for requests and Mongo writes. |
| 0005 | Canvas Load & Save Wiring | Load existing intentions on mount, seed mock state if needed, emit debug events for load and first save. |
| 0006 | Autosave Hook + Status UI | Debounced PUT (~1.5 s); badge for “Saving…/Saved/Error”; debug traces for each cycle. |
| 0007 | Error Handling & Retry | Exponential retry (max 3) with debug messages and visible status updates. |
| 0008 | Close-out Snapshot | Finalize epoch, update roadmap, archive logs. |

---

## ⚙️ Technical Notes
- Re-use `lib/mongodb.ts` connection.  
- `debug.trace|info|warn|error` called in every API handler and autosave path.  
- `MONGODB_DB_NAME` defaults to `lumin`.  
- Auth context from NextAuth (`session.user.email`); fallback `test@test.com` in non-prod.  

---

## 🧠 Design Principles
- **Observable:** all key actions log through debug console and server stdout.  
- **Reliable:** live database writes only after mocking disabled.  
- **Incremental:** no offline layer until core autosave is stable.  
- **Recoverable:** retry and error paths log clear state for diagnostics.  

---

## 🧪 Success Criteria
- MSW disabled by default in preview/production.  
- Debug overlay shows Intentions API → Mongo trace flow.  
- Canvas refresh reflects persisted data from Mongo.  
- Autosave badge and debug logs confirm write cycles.  

---

## 🧾 Audit & Documentation
- Update `/docs/STATE/STATUS.yaml` → `current_epoch: "0004-persistence-autosave"`.  
- Log each PR under `/docs/LOGS/AUDIT/epoch-0004-*`.  
- Archive epoch in `/docs/HISTORY/EPOCHS/0004-persistence-autosave/` at completion.  

---

## 🚀 Exit Criteria
- Real persistence active and observable through debug console.  
- No mock responses outside explicit local testing.  
- Retry and error logging verified.  
- Docs and audit entries complete.
