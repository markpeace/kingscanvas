import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { debug } from "@/lib/debug";
import { authOptions } from "./auth/[...nextauth]";
import { handleApiError } from "@/lib/apiError";
import { getUserIntentions, saveUserIntentions } from "@/lib/userData";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);
    const userEmail =
      session?.user?.email || process.env.DEBUG_USER || "test@test.com";

    if (!userEmail) {
      debug.error("Intentions API: unauthenticated");
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    switch (req.method) {
      case "GET": {
        debug.trace("Intentions API: fetching intentions", { email: userEmail });
        const data = await getUserIntentions(userEmail);
        debug.info("Intentions API: fetch complete", { found: Boolean(data) });
        res.status(200).json(data ?? { user: userEmail, intentions: [] });
        return;
      }
      case "POST":
      case "PUT": {
        debug.trace("Intentions API: saving intentions", {
          email: userEmail,
          body: req.body
        });
        await saveUserIntentions(userEmail, req.body);
        debug.info("Intentions API: save complete", { email: userEmail });
        res.status(200).json({ ok: true });
        return;
      }
      default: {
        res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    debug.error("Intentions API: server error", { message: error.message });
    handleApiError(res, error, "Intentions API error");
  }
}
