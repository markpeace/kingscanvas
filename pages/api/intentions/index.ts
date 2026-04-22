import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions, createTestSession, isProd } from "@/lib/auth/config";
import { debug } from "@/lib/debug";
import { getStudentIntentions, saveStudentIntentions } from "@/lib/studentCanvas/repository";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = isProd
    ? await getServerSession(req, res, authOptions)
    : createTestSession();
  const email = session?.user?.email ?? null;

  if (!email) {
    debug.error("Intentions API: unauthenticated request");
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    if (req.method === "GET") {
      debug.trace("Intentions API: GET", { user: email });
      const intentions = await getStudentIntentions(email);
      debug.info("Intentions API: GET complete", { count: intentions.length });
      return res.status(200).json({ intentions });
    }

    if (req.method === "PUT" || req.method === "POST") {
      debug.trace("Intentions API: write", {
        user: email,
        keys: Object.keys(req.body || {}),
      });
      await saveStudentIntentions(email, req.body?.intentions || []);
      debug.info("Intentions API: write complete", { user: email });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    debug.error("Intentions API: server error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "Server error" });
  }
}
