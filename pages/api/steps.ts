import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "./auth/[...nextauth]";
import { handleApiError } from "@/lib/apiError";
import { getUserSteps, saveUserStep } from "@/lib/userData";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);
    const userEmail =
      session?.user?.email || process.env.DEBUG_USER || "test@test.com";

    if (!userEmail) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    switch (req.method) {
      case "GET": {
        const data = await getUserSteps(userEmail);
        res.status(200).json(data ?? []);
        return;
      }
      case "POST":
      case "PUT": {
        await saveUserStep(userEmail, req.body);
        res.status(200).json({ ok: true });
        return;
      }
      default: {
        res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (err) {
    handleApiError(res, err, "Steps API error");
  }
}
