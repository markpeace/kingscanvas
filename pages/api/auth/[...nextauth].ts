import type { NextApiHandler } from "next"
import NextAuth from "next-auth"

import { authOptions, createTestSession, isProd } from "@/lib/auth/config"

if (!isProd) {
  console.log("⚙️  Non-production build: returning static test session.")
}

const staticHandler: NextApiHandler = (req, res) => {
  if (req.url?.endsWith("/session")) {
    const session = createTestSession()
    return res.status(200).json(session)
  }

  return res.status(200).json({ ok: true })
}

const handler: NextApiHandler = isProd ? NextAuth(authOptions) : staticHandler

export default handler
