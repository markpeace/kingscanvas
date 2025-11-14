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
import { generateSimulatedOpportunitiesForStep } from "@/lib/opportunities/generation";

function normaliseStepId(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "toString" in value && typeof value.toString === "function") {
    const serialised = value.toString();
    return serialised && serialised !== "[object Object]" ? serialised : null;
  }

  return null;
}

function scheduleOpportunityGeneration(user: string, stepIds: unknown[]) {
  const uniqueIds = Array.from(
    new Set(
      stepIds
        .map((value) => normaliseStepId(value))
        .filter((value): value is string => Boolean(value))
    )
  );

  if (uniqueIds.length === 0) {
    return;
  }

  uniqueIds.forEach((stepId) => {
    void generateSimulatedOpportunitiesForStep(user, stepId)
      .then((opportunities) => {
        debug.trace("Steps API: opportunity generation finished", {
          user,
          stepId,
          generated: opportunities.length,
        });
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        debug.error("Steps API: opportunity generation failed", {
          user,
          stepId,
          message,
        });
      });
  });
}

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
      return res.status(200).json({ ok: true });
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

        const result = await createSuggestedSteps(email, intentionId, steps);

        const insertedIdsRaw = result?.insertedIds
          ? Object.values(result.insertedIds)
          : [];
        const insertedIds = insertedIdsRaw
          .map((value) => normaliseStepId(value))
          .filter((value): value is string => Boolean(value));

        if (insertedIds.length) {
          scheduleOpportunityGeneration(email, insertedIds);
        }

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
      const result = await saveUserStep(email, req.body);
      const bodyStepId = normaliseStepId(req.body?._id ?? req.body?.id);
      const upsertedId = normaliseStepId(result.upsertedId ?? null);
      const finalStepId = bodyStepId ?? upsertedId;

      if (finalStepId && result.upsertedCount > 0) {
        scheduleOpportunityGeneration(email, [finalStepId]);
      }

      debug.info("Steps API: write complete", {
        user: email,
        stepId: finalStepId ?? null,
      });

      return res.status(200).json(finalStepId ? { ok: true, stepId: finalStepId } : { ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    debug.error("Steps API: server error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "Server error" });
  }
}
