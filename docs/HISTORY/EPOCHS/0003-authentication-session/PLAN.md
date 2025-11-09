# Epoch 0003 — Authentication & Session Handling

**Parent Project:** Lumin Canvas  
**Epoch ID:** 0003  
**Branch:** `feature/epoch-0003/authentication-session`  
**Start Date:** 2025-11-09  
**Status:** In Progress

---

## 🎯 Objective
Integrate **Google Sign-In via NextAuth.js** to authenticate users and establish secure sessions.  
All Canvas data will become user-specific, preparing the foundation for persistence and analytics in later epochs.

---

## 🧩 Deliverables
| PR | Title | Purpose |
|----|--------|----------|
| **0001** | Plan Injection | Add PLAN.md to define authentication epoch. |
| **0002** | Protect Canvas Routes | Add server-side route guard using `getServerSession` and redirect unauthenticated users to `/login`. |
| **0003** | Branded Login Page | Replace default NextAuth sign-in with King’s-branded `/login` page. |
| **0004** | Session UI & Header Menu | Show user avatar, name, and sign-out link in Canvas header. |
| **0005** | User Session Context | Add `useUser()` hook for unified session access. |
| **0006** | Auth Middleware | Create `withAuth` helper for future API routes. |
| **0007** | Close-out Snapshot | Verify login/logout flow and archive epoch. |

---

## ⚙️ Technical Notes
- Uses existing NextAuth.js configuration from template repo (Google provider).  
- No DB adapter yet — JWT session store only.  
- Protect `/canvas` and all `/api/*` endpoints.  
- Use `SessionProvider` (already wrapped in `_app.tsx`).  
- Apply `getServerSession` for SSR routes; `useSession()` for client.  

---

## 🎨 Design Notes
- Login page uses King’s red accent (`#cc0000`) and minimal branding.  
- “Sign in with Google” button styled consistently with Epoch 0002 typography.  

---

## 🧪 Success Criteria
- Unauthenticated users are redirected to `/login`.  
- Authenticated users reach `/canvas` with active session.  
- User menu in header shows name/avatar and logout.  
- Build/lint/test clean.  

---

## 🚀 Exit Criteria
- Google OAuth working end-to-end.  
- Canvas and API routes protected by session.  
- Epoch archived with audit logs.
