import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions, createTestSession, isProd } from "@/lib/auth/config";
import { debug } from "@/lib/debug";
import {
  createSuggestedSteps,
  getUserSteps,
  saveUserStep,
  updateStepStatus,
} from "@/lib/userData";
import {
  safelyGenerateOpportunitiesForStep,
  stepHasOpportunities,
} from "@/lib/opportunities/generation";

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

    if (req.method === "PUT") {
      const { stepId, status } = req.body || {};

      if (typeof stepId !== "string" || !stepId || typeof status !== "string") {
        debug.error("Steps API: invalid status update payload", {
          user: email,
          hasStepId: Boolean(stepId),
          status,
        });
        return res.status(400).json({ error: "Invalid payload" });
      }

      debug.trace("Steps API: update status", { user: email, stepId, status });
      const result = await updateStepStatus(email, stepId, status);
      debug.info("Steps API: update status result", { matched: result.matchedCount });

      if (status === "accepted" && typeof stepId === "string" && stepId.trim().length > 0) {
        const canonicalStepId = stepId.trim();

        try {
          const alreadyHasOpportunities = await stepHasOpportunities(canonicalStepId);

          if (!alreadyHasOpportunities) {
            await safelyGenerateOpportunitiesForStep(canonicalStepId, "ai-accepted");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          debug.error("Opportunities: auto generation failed to complete", {
            stepId: canonicalStepId,
            origin: "ai-accepted",
            message,
            error,
          });
        }
      }

      return res.status(200).json({ ok: true });
    }

    if (req.method === "POST") {
      const { intentionId, steps } = req.body || {};

      if (Array.isArray(steps)) {
        // Persisting AI ghost suggestions must never trigger opportunity generation.
        if (typeof intentionId !== "string" || intentionId.length === 0) {
          debug.error("Steps API: bulk write missing intentionId", { user: email });
          return res.status(400).json({ error: "Missing intentionId" });
        }

        debug.trace("Steps API: bulk suggestion write", {
          user: email,
          intentionId,
          count: steps.length,
        });

        const result = await createSuggestedSteps(email, intentionId, steps);

        const insertedIds = result?.insertedIds
          ? Object.values(result.insertedIds).map((value) => value?.toString?.() ?? String(value))
          : [];

        debug.info("Steps API: bulk suggestion write complete", {
          user: email,
          count: steps.length,
        });

        return res.status(200).json({ ok: true, insertedIds });
      }
    }

    if (req.method === "POST") {
      debug.trace("Steps API: write", {
        user: email,
        payloadKeys: Object.keys(req.body || {}),
      });
      const saveResult = await saveUserStep(email, req.body);
      debug.info("Steps API: write complete", { user: email });

      const persistedStepId =
        typeof saveResult?.stepId === "string" && saveResult.stepId.trim().length > 0
          ? saveResult.stepId.trim()
          : typeof req.body?._id === "string" && req.body._id.trim().length > 0
          ? req.body._id.trim()
          : typeof req.body?.id === "string" && req.body.id.trim().length > 0
          ? req.body.id.trim()
          : null;

      if (persistedStepId) {
        try {
          const alreadyHasOpportunities = await stepHasOpportunities(persistedStepId);

          if (!alreadyHasOpportunities) {
            await safelyGenerateOpportunitiesForStep(persistedStepId, "manual");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          debug.error("Opportunities: auto generation failed to complete", {
            stepId: persistedStepId,
            origin: "manual",
            message,
            error,
          });
        }
      }

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
