// Step-generation prompt builder for King's Canvas
// PR-3: initial extraction and refinement

export interface StepPromptContext {
  intention: string
  bucket: string
  // context fields added in later PRs (PR-5/6)
  degreeLevel?: string
  studyMode?: string
  discipline?: string
  year?: number
}

// The builder returns a plain string prompt.
// Later PRs will expand this with structured context.
export function buildStepPrompt(ctx: StepPromptContext): string {
  const { intention, bucket } = ctx

  return `
You are generating high-quality developmental steps for a student using King's Canvas.

The student's intention is:
"${intention}"

You must output one step only.

Your step must:
- Focus on knowledge, skills, or experience.
- Be concise and concrete.
- Describe *what* the student should work on, not *how* to do it.
- Avoid generic careers advice.
- Avoid templates or repeated phrasing.
- Align with the appropriate intention bucket:

Bucket meanings:
• "do-now": small, simple actions that build early understanding or awareness.
• "do-later": larger foundational work that takes more time or deeper inquiry.
• "before-graduation": significant, culminating work aligned with progression.
• "after-graduation": forward-looking steps relating to transition into post-study goals.

Write the step as a single actionable sentence.

Now produce the step.
  `.trim()
}
