export type BuildSuggestionPromptOptions = {
  intentionText: string
  targetBucket: string
  historyAccepted?: string[]
  historyRejected?: string[]
}

export function buildSuggestionPrompt({
  intentionText,
  targetBucket,
  historyAccepted = [],
  historyRejected = []
}: BuildSuggestionPromptOptions) {
  return `
You are an assistant helping a university student take practical steps toward achieving their intention:

Intention: "${intentionText}"

Your job is to generate ONE clear, specific, actionable step that belongs in the bucket: "${targetBucket}".

### Requirements

1. The step must be something the student can realistically do.
2. It must be concrete and behaviour-focused.
3. It must NOT repeat or closely resemble any of the previously suggested, accepted, or rejected steps:

Accepted:
${historyAccepted.map((s) => `- ${s}`).join("\n")}

Rejected:
${historyRejected.map((s) => `- ${s}`).join("\n")}

4. Do not produce motivational advice, reflections, or general encouragement.
5. Do not produce multi-step lists—output only ONE step.
6. Avoid vague verbs ("reflect", "consider", "think about").
7. Tailor the step explicitly to the intention "${intentionText}".

### Bucket Constraints:

- **do_now:**  
  Provide a small, low-effort, immediately actionable step the student can do today or in the next 24 hours.

- **do_soon:**  
  Provide a planning or preparation step that requires a bit more time, such as research, drafting, or scheduling.

- **before_grad:**  
  Provide a milestone step that moves the student toward completing a larger requirement, gaining experience, or making a significant commitment.

### Output format:
Return ONLY the step text. Do not prefix with "Step:" or a number. Do not explain your reasoning.
  `
}
