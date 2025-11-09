# Epoch 0004 — Persistence & Autosave

**Parent Project:** Lumin Canvas  
**Epoch ID:** 0004  
**Branch:** `feature/epoch-0004/persistence-autosave`  
**Start Date:** 2025-11-10  
**Status:** In Progress  

---

## 🎯 Objective
Extend the existing MongoDB integration in the codebase to persist user plans (intentions + steps) and implement background autosave for seamless data retention across sessions.

---

## 🧩 Deliverables

| PR | Title | Purpose |
|----|--------|----------|
| 0001 | Plan Injection | Add PLAN.md to define persistence epoch. |
| 0002 | Extend MongoDB Utilities & Collections | Reuse `lib/mongodb.ts`; configure helper functions for `intentions` and `steps` collections keyed by `user.email`. |
| 0003 | CRUD API Routes | Implement `/api/intentions` and `/api/steps` endpoints supporting create, read, update, delete. |
| 0004 | Autosave Hook | Add a debounced React hook that automatically persists Canvas edits (≈ 1.5 s delay). |
| 0005 | Save Status UI | Display a small bottom-right indicator (“Saving…” → “Saved”). |
| 0006 | Error Handling & Retry | Retry failed writes; show toast after repeated failures. |
| 0007 | Offline Fallback | Cache unsaved edits in IndexedDB and sync on reconnection. |
| 0008 | Close-out Snapshot | QA verification, documentation update, archive epoch. |

---

## ⚙️ Technical Notes
- Use the existing **`lib/mongodb.ts`** utility and global connection cache.  
- Continue to rely on environment vars already defined:  
  ```bash
  MONGODB_URI=mongodb+srv://…
  MONGODB_DB_NAME=lumin
  ```
- Document shape:  
  ```json
  {
    "user": "test@test.com",
    "intentions": [
      { "title": "Become a teacher", "steps": [ { "text": "Apply for PGCE" } ] }
    ],
    "updatedAt": "2025-11-10T12:00:00Z"
  }
  ```
- Auth link: use `session.user.email` from NextAuth for all queries.  
- Autosave triggered via `useEffect` + debounce (~1500 ms).  
- Writes occur asynchronously to avoid blocking UI.  

---

## 🧠 Design Principles
- **Seamless:** no manual save actions.  
- **Resilient:** edits survive refresh, network drops, and preview bypass.  
- **Transparent:** clear save-state feedback.  
- **Performant:** minimal payloads and efficient incremental updates.

---

## 🧪 Success Criteria
- Canvas state persists between sessions.  
- “Saving…” indicator behaves correctly.  
- Offline edits sync on reconnection.  
- Average API latency ≤ 200 ms.  
- Build / lint / test clean.  

---

## 🧾 Audit & Documentation
- `/docs/STATE/STATUS.yaml` → `current_epoch: "0004-persistence-autosave"`.  
- Each PR logged under `/docs/LOGS/AUDIT/epoch-0004-*`.  
- Archive on completion at `/docs/HISTORY/EPOCHS/0004-persistence-autosave/`.  

---

## 🚀 Exit Criteria
- MongoDB persistence and autosave fully operational.  
- No data loss on refresh or relogin.  
- Offline cache and retry logic confirmed.  
- Documentation + audit logs complete.
