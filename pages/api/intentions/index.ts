import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions, createTestSession, isProd } from "@/lib/auth/config";
import { debug } from "@/lib/debug";
import { toCanonicalIntentionsFromUnknown, toUiIntentionsFromUnknown } from "@/lib/studentCanvas/mappers";
import { getStudentIntentions, saveStudentIntentions } from "@/lib/studentCanvas/repository";
import {
  StudentCanvasValidationError,
  assertValidStudentCanvasDocument,
  validateStudentCanvasDocument,
} from "@/lib/studentCanvas/validation";

function toValidationResponse(error: StudentCanvasValidationError) {
  return {
    error: "Invalid request payload",
    code: "VALIDATION_ERROR",
    details: error.issues,
  };
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
    debug.error("Intentions API: unauthenticated request");
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    if (req.method === "GET") {
      debug.trace("Intentions API: GET", { user: email });
      const canonicalIntentions = await getStudentIntentions(email);

      if (!isProd) {
        const candidateDocument = {
          schema_version: "1.0.0",
          student_id: email,
          created_at: new Date(0).toISOString(),
          updated_at: new Date().toISOString(),
          canvas: { intentions: canonicalIntentions },
        };

        const result = validateStudentCanvasDocument(candidateDocument);
        if (!result.valid) {
          debug.warn("Intentions API: outbound canonical validation failed", {
            user: email,
            issues: result.issues,
          });
        }
      }

      const intentions = toUiIntentionsFromUnknown(canonicalIntentions);
      debug.info("Intentions API: GET complete", { count: intentions.length });
      return res.status(200).json({ intentions });
    }

    if (req.method === "PUT" || req.method === "POST") {
      debug.trace("Intentions API: write", {
        user: email,
        keys: Object.keys(req.body || {}),
      });
      const canonicalIntentions = toCanonicalIntentionsFromUnknown(req.body?.intentions);
      const timestamp = new Date().toISOString();

      assertValidStudentCanvasDocument(
        {
          schema_version: "1.0.0",
          student_id: email,
          created_at: timestamp,
          updated_at: timestamp,
          canvas: { intentions: canonicalIntentions },
        },
        "intentions.write"
      );

      await saveStudentIntentions(email, canonicalIntentions);
      debug.info("Intentions API: write complete", { user: email });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    if (error instanceof StudentCanvasValidationError) {
      debug.warn("Intentions API: validation failed", {
        user: email,
        issues: error.issues,
      });
      return res.status(400).json(toValidationResponse(error));
    }

    debug.error("Intentions API: server error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "Server error" });
  }
}
