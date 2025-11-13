import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions, createTestSession, isProd } from "@/lib/auth/config";
import { debug } from "@/lib/debug";
import {
  deleteOpportunity,
  getOpportunityById,
  upsertOpportunity,
} from "@/lib/userData";
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

function getOpportunityIdFromQuery(queryValue: NextApiRequest["query"]["id"]): string | null {
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
    debug.error("Opportunity detail API: unauthenticated request");
    return res.status(401).json({ error: "Not authenticated" });
  }

  const opportunityId = getOpportunityIdFromQuery(req.query.id);

  if (!opportunityId) {
    debug.error("Opportunity detail API: missing id", { user: email });
    return res.status(400).json({ error: "Invalid opportunity id" });
  }

  try {
    if (req.method === "PUT") {
      const existing = await getOpportunityById(email, opportunityId);

      if (!existing) {
        debug.info("Opportunity detail API: update not found", { user: email, opportunityId });
        return res.status(404).json({ error: "Not found" });
      }

      const { title, summary, source, form, focus, status, stepId } = req.body || {};

      let nextTitle = existing.title;
      if (title !== undefined) {
        if (typeof title !== "string" || !title.trim()) {
          return res.status(400).json({ error: "Invalid title" });
        }
        nextTitle = title.trim();
      }

      let nextSummary = existing.summary;
      if (summary !== undefined) {
        if (typeof summary !== "string" || !summary.trim()) {
          return res.status(400).json({ error: "Invalid summary" });
        }
        nextSummary = summary.trim();
      }

      let nextSource = existing.source;
      if (source !== undefined) {
        if (typeof source !== "string" || !SOURCE_VALUES.includes(source as OpportunitySource)) {
          return res.status(400).json({ error: "Invalid source" });
        }
        nextSource = source as OpportunitySource;
      }

      let nextForm = existing.form;
      if (form !== undefined) {
        if (typeof form !== "string" || !FORM_VALUES.includes(form as OpportunityForm)) {
          return res.status(400).json({ error: "Invalid form" });
        }
        nextForm = form as OpportunityForm;
      }

      let nextFocus = existing.focus;
      if (focus !== undefined) {
        const normalizedFocus = normalizeFocusInput(focus);
        if (!normalizedFocus) {
          return res.status(400).json({ error: "Invalid focus" });
        }
        nextFocus = normalizedFocus;
      }

      let nextStatus = existing.status;
      if (status !== undefined) {
        if (typeof status !== "string" || !STATUS_VALUES.includes(status as OpportunityStatus)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        nextStatus = status as OpportunityStatus;
      }

      let nextStepId = existing.stepId;
      if (stepId !== undefined) {
        if (typeof stepId !== "string" || !stepId.trim()) {
          return res.status(400).json({ error: "Invalid stepId" });
        }
        nextStepId = stepId.trim();
      }

      debug.trace("Opportunity detail API: PUT", { user: email, opportunityId });
      const updated = await upsertOpportunity(email, {
        id: opportunityId,
        stepId: nextStepId,
        title: nextTitle,
        summary: nextSummary,
        source: nextSource,
        form: nextForm,
        focus: nextFocus,
        status: nextStatus,
      });
      debug.info("Opportunity detail API: PUT complete", {
        user: email,
        opportunityId,
      });
      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      debug.trace("Opportunity detail API: DELETE", { user: email, opportunityId });
      await deleteOpportunity(email, opportunityId);
      debug.info("Opportunity detail API: DELETE complete", { user: email, opportunityId });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    debug.error("Opportunity detail API: server error", {
      user: email,
      opportunityId,
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "Server error" });
  }
}
