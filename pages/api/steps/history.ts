import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions, createTestSession, isProd } from "@/lib/auth/config";
import { debug } from "@/lib/debug";
import { listRecentHistory } from "@/lib/userData";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = isProd ? await getServerSession(req, res, authOptions) : createTestSession();
  const email = session?.user?.email ?? null;

  if (!email) {
    debug.error("Steps API: history unauthenticated");
    return res.status(401).json({ error: "Not authenticated" });
  }

  const intentionIdParam = req.query.intentionId;
  const intentionId = typeof intentionIdParam === "string" ? intentionIdParam : "";

  debug.trace("Steps API: history fetch", { intentionId, user: email });

  try {
    const data = await listRecentHistory(email, intentionId);
    debug.info("Steps API: history result", {
      accepted: data.accepted.length,
      rejected: data.rejected.length,
    });
    return res.status(200).json(data);
  } catch (error) {
    debug.error("Steps API: history failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "History fetch failed" });
  }
}
