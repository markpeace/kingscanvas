import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions, createTestSession, isProd } from "@/lib/auth/config";
import { debug } from "@/lib/debug";
import { getOpportunitiesByStep, upsertOpportunity } from "@/lib/userData";
import type {
  OpportunityFocus,
  OpportunityForm,
  OpportunitySource,
  OpportunityStatus,
} from "@/types/canvas";

const SOURCE_VALUES: OpportunitySource[] = ["edge_simulated", "independent"];
const FORM_VALUES: OpportunityForm[] = ["intensive", "evergreen", "short_form", "sustained"];
const FOCUS_VALUES: OpportunityFocus[] = ["capability", "capital", "credibility"];
const STATUS_VALUES: OpportunityStatus[] = ["suggested", "saved", "dismissed"];

function normalizeFocusInput(value: unknown): OpportunityFocus[] | null {
  if (Array.isArray(value)) {
    const candidates = value.filter((item): item is string => typeof item === "string");
    if (candidates.length !== value.length) {
      return null;
    }

    const focus = candidates.map((item) => item.trim()).filter(Boolean) as OpportunityFocus[];
    return focus.every((item) => FOCUS_VALUES.includes(item)) && focus.length > 0 ? focus : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim() as OpportunityFocus;
    return FOCUS_VALUES.includes(trimmed) ? [trimmed] : null;
  }

  return null;
}

function getStepIdFromQuery(queryValue: NextApiRequest["query"]["stepId"]): string | null {
  if (Array.isArray(queryValue)) {
    return typeof queryValue[0] === "string" ? queryValue[0] : null;
  }

  return typeof queryValue === "string" ? queryValue : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = isProd
    ? await getServerSession(req, res, authOptions)
    : createTestSession();
  const email = session?.user?.email ?? null;

  if (!email) {
    debug.error("Opportunities API: unauthenticated request");
    return res.status(401).json({ error: "Not authenticated" });
  }

  const stepId = getStepIdFromQuery(req.query.stepId);

  if (!stepId) {
    debug.error("Opportunities API: missing stepId", { user: email });
    return res.status(400).json({ error: "Invalid stepId" });
  }

  try {
    if (req.method === "GET") {
      debug.trace("Opportunities API: GET", { user: email, stepId });
      const opportunities = await getOpportunitiesByStep(email, stepId);
      debug.info("Opportunities API: GET complete", {
        user: email,
        stepId,
        returnedCount: opportunities.length,
        statuses: opportunities.reduce<Record<string, number>>((acc, item) => {
          acc[item.status] = (acc[item.status] ?? 0) + 1;
          return acc;
        }, {}),
        sources: opportunities.reduce<Record<string, number>>((acc, item) => {
          acc[item.source] = (acc[item.source] ?? 0) + 1;
          return acc;
        }, {}),
      });
      return res.status(200).json(opportunities);
    }

    if (req.method === "POST") {
      const { title, summary, source, form, focus, status } = req.body || {};

      const normalizedFocus = normalizeFocusInput(focus);
      const normalizedTitle = typeof title === "string" ? title.trim() : "";
      const normalizedSummary = typeof summary === "string" ? summary.trim() : "";
      const isValidSource = typeof source === "string" && SOURCE_VALUES.includes(source as OpportunitySource);
      const isValidForm = typeof form === "string" && FORM_VALUES.includes(form as OpportunityForm);
      const isValidStatus = typeof status === "string" && STATUS_VALUES.includes(status as OpportunityStatus);

      if (!normalizedTitle || !normalizedSummary || !normalizedFocus || !isValidSource || !isValidForm || !isValidStatus) {
        debug.error("Opportunities API: invalid payload", { user: email, stepId });
        return res.status(400).json({ error: "Invalid payload" });
      }

      debug.trace("Opportunities API: POST", { user: email, stepId });
      const opportunity = await upsertOpportunity(email, {
        stepId,
        title: normalizedTitle,
        summary: normalizedSummary,
        source: source as OpportunitySource,
        form: form as OpportunityForm,
        focus: normalizedFocus,
        status: status as OpportunityStatus,
      });
      debug.info("Opportunities API: POST complete", {
        user: email,
        stepId,
        opportunityId: opportunity.id,
      });
      return res.status(201).json(opportunity);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    debug.error("Opportunities API: server error", {
      user: email,
      stepId,
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "Server error" });
  }
}
