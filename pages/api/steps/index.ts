import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions, createTestSession, isProd } from "@/lib/auth/config";
import { debug } from "@/lib/debug";
import { createSuggestedSteps, getUserSteps, saveUserStep } from "@/lib/userData";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = isProd
    ? await getServerSession(req, res, authOptions)
    : createTestSession();
  const email = session?.user?.email ?? null;

  if (!email) {
    debug.error("Steps API: unauthenticated request");
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    if (req.method === "GET") {
      debug.trace("Steps API: GET", { user: email });
      const data = await getUserSteps(email);
      debug.info("Steps API: GET complete", { count: data?.length || 0 });
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { intentionId, steps } = req.body || {};

      if (Array.isArray(steps)) {
        if (typeof intentionId !== "string" || intentionId.length === 0) {
          debug.error("Steps API: bulk write missing intentionId", { user: email });
          return res.status(400).json({ error: "Missing intentionId" });
        }

        debug.trace("Steps API: bulk suggestion write", {
          user: email,
          intentionId,
          count: steps.length,
        });

        await createSuggestedSteps(email, intentionId, steps);

        debug.info("Steps API: bulk suggestion write complete", {
          user: email,
          count: steps.length,
        });

        return res.status(200).json({ ok: true });
      }
    }

    if (req.method === "PUT" || req.method === "POST") {
      debug.trace("Steps API: write", {
        user: email,
        payloadKeys: Object.keys(req.body || {}),
      });
      await saveUserStep(email, req.body);
      debug.info("Steps API: write complete", { user: email });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    debug.error("Steps API: server error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "Server error" });
  }
}
