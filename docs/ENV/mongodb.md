# MongoDB Environment Variables

Set the following in Vercel → Project → Settings → Environment Variables (and in `.env.local` for local dev):

- `MONGODB_URI` — Full connection string from MongoDB Atlas (SRV recommended).
- `MONGODB_DB` — Database name to use (e.g., `nextjspwa_template`).

After setting vars and redeploying, verify connectivity at:
- `/api/db/health` → should return `{ "ok": true, "db": "<your-db-name>" }`.
