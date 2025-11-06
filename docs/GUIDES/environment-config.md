# Environment Configuration — Local & Vercel

This project uses environment variables for auth, database, AI, and debugging. We never commit real secrets to the repo.

## Variables (authoritative list)
- `NEXTAUTH_URL` — Public base URL for NextAuth callbacks (e.g., http://localhost:3000 for local).
- `NEXTAUTH_SECRET` — Random string used by NextAuth to sign/encrypt sessions.
- `GOOGLE_CLIENT_ID` — Google OAuth credential.
- `GOOGLE_CLIENT_SECRET` — Google OAuth secret.
- `MONGODB_URI` — MongoDB connection string.
- `MONGODB_DB` — Mongo database name used by the app.
- `OPENAI_API_KEY` — API key for OpenAI (used by LangChain/LangGraph).
- `DEBUG_PANEL_ENABLED` — "true"/"false" to toggle the in-app debug panel on the server side.
- `NEXT_PUBLIC_DEBUG_PANEL` — "true"/"false" to toggle the debug panel from the client.

## Local setup
1. Copy `.env.example` → `.env.local`.
2. Fill in values for your environment (keep `.env.local` untracked).
3. Restart the dev server after changes: `npm run dev`.

## Vercel setup
1. Open your Vercel Project → **Settings** → **Environment Variables**.
2. Add each variable (`Name`, `Value`) for “Preview” and “Production” as appropriate.
3. Trigger a new Preview by pushing to your branch; verify the build.

## Tips
- Never commit real values. Only `.env.example` lives in git.
- If a new variable is introduced later, update both `.env.example` and this guide.
