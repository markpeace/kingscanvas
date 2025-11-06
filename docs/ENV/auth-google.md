# Auth Environment Variables — NextAuth + Google

Set these in Vercel → Project → Settings → Environment Variables (and in `.env.local` for local dev):

- `GOOGLE_CLIENT_ID` — Google Cloud Console → Credentials → OAuth 2.0 Client IDs (Web).
- `GOOGLE_CLIENT_SECRET` — from the same OAuth client.
- `NEXTAUTH_SECRET` — generate a random 32+ char string (e.g. `openssl rand -base64 32`).
- `NEXTAUTH_URL` — your site base URL. Examples:
    - Local: `http://localhost:3000`
    - Vercel Preview: `https://<branch>-<repo-owner>.vercel.app`
    - Vercel Prod: `https://<your-domain>`

**OAuth Redirect URI (Callback)**
- Add to Google OAuth client:
  - `https://<your-domain>/api/auth/callback/google`
  - For local dev: `http://localhost:3000/api/auth/callback/google`

Notes:
- We use **JWT sessions** (no DB adapter required yet).
- Sign-in page: `/login` (wired in a later PR).
