export function buildSuggestionPromptV2({
  intentionText,
  targetBucket,
  historyAccepted = [],
  historyRejected = []
}: {
  intentionText: string
  targetBucket: string
  historyAccepted?: string[]
  historyRejected?: string[]
}) {
  return `
You are helping a university student take realistic, practical steps toward achieving this intention:

"${intentionText}"

Think of this intention as a direction of travel. Your task is to provide ONE clear, concrete step that meaningfully moves the student forward. You are not summarising the intention or offering reflection. You are generating a real-world action.

The student has previously seen or taken these steps:

Accepted:
${historyAccepted.length ? historyAccepted.map(s => "- " + s).join("\n") : "- (none)"}

Rejected:
${historyRejected.length ? historyRejected.map(s => "- " + s).join("\n") : "- (none)"}

Your step MUST:
- Be specific, observable, and something a student could actually do.
- Be different in idea and language from all accepted or rejected steps above.
- Refer directly or indirectly to the intention "${intentionText}".
- Avoid motivational or reflective advice.
- Avoid lists or multi-step instructions. Output exactly ONE step.
- Avoid vague verbs like “consider”, “reflect”, or “think about” unless paired with a specific action.
- Avoid suggesting steps that are too large for the target bucket.

Bucket rules:
- "do_now": A small, low-effort action the student could do today or within 24 hours.
- "do_soon": A short-term preparation or planning action that requires some time investment.
- "before_grad": A larger milestone or commitment that reasonably happens over weeks or months before graduation.

Below are examples of concrete actions. These are not templates; you may improvise beyond them:

Examples (illustrative only):
- Sending a short message or enquiry to someone.
- Signing up for, or expressing interest in, an event or group.
- Exploring real opportunities online and noting a small set of options.
- Drafting or updating a brief piece of material (a CV section, a paragraph, a short plan).
- Observing or shadowing someone doing an aspect of the intention.
- Trying a small, low-risk experiment related to the intention.
- Preparing specific questions for someone knowledgeable.
- Comparing a few realistic, available pathways or requirements.

These are only examples. Suggest whichever single action best fits the intention.

Output rules:
Return only the text of the step with no prefixes, labels, or justification.
  `
}
