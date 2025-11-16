import type {
  BucketId,
  OpportunityFocus,
  OpportunityForm,
  OpportunitySource,
  OpportunityStatus
} from "@/types/canvas"

export interface OpportunityDraft {
  title: string
  summary: string
  source: OpportunitySource
  form: OpportunityForm
  focus: OpportunityFocus
  status?: OpportunityStatus
}

type DraftContext = {
  stepTitle: string
  intentionTitle?: string
  bucket?: string
  context: string
}

type DraftFactory = (context: DraftContext) => OpportunityDraft

type ThemeId = "education" | "research" | "general"

const EDGE_SOURCE: OpportunitySource = "kings-edge-simulated"
const INDEPENDENT_SOURCE: OpportunitySource = "independent"

const EDGE_FORMS: OpportunityForm[] = ["workshop", "mentoring", "short-course", "coaching"]
const INDEPENDENT_FORM: OpportunityForm = "independent-action"

const THEMES: Record<ThemeId, { edge: DraftFactory[]; independent: DraftFactory }> = {
  education: {
    edge: [
      (ctx) => ({
        title: "Attend a King's Edge workshop on classroom experience",
        summary: `Join a simulated King's Edge workshop that introduces routes into teaching and practical steps to build classroom experience while focusing on ${ctx.context}.`,
        source: EDGE_SOURCE,
        form: EDGE_FORMS[0],
        focus: "skills"
      }),
      (ctx) => ({
        title: "Shadow a student ambassador during a school outreach activity",
        summary: `Take part in a simulated King's Edge outreach activity where you observe or support current student ambassadors working with local schools connected to ${ctx.context}.`,
        source: EDGE_SOURCE,
        form: EDGE_FORMS[1],
        focus: "experience"
      }),
      (ctx) => ({
        title: "Book a King's Edge one to one planning session",
        summary: `Use a simulated King's Edge one to one to map how your modules, part time work and volunteering can contribute to ${ctx.context}.`,
        source: EDGE_SOURCE,
        form: EDGE_FORMS[3],
        focus: "reflection"
      })
    ],
    independent: (ctx) => ({
      title: "Volunteer independently in a local school or youth club",
      summary: `Identify a local school, homework club or youth organisation and offer to support a regular session that reinforces ${ctx.context}.`,
      source: INDEPENDENT_SOURCE,
      form: INDEPENDENT_FORM,
      focus: "experience"
    })
  },
  research: {
    edge: [
      (ctx) => ({
        title: "Attend a King's Edge research briefing",
        summary: `Join a simulated briefing on how King's Edge students turn ${ctx.context} into portfolio-ready research experience.`,
        source: EDGE_SOURCE,
        form: EDGE_FORMS[0],
        focus: "skills"
      }),
      (ctx) => ({
        title: "Book a peer research mentoring session",
        summary: `Speak with a simulated King's Edge mentor who has led small lab projects and can help you frame ${ctx.context} into a focused plan.`,
        source: EDGE_SOURCE,
        form: EDGE_FORMS[1],
        focus: "reflection"
      }),
      (ctx) => ({
        title: "Join a short course on communicating research",
        summary: `Complete a short King's Edge course on presenting findings so you can explain the purpose of ${ctx.context} with confidence.`,
        source: EDGE_SOURCE,
        form: EDGE_FORMS[2],
        focus: "community"
      })
    ],
    independent: (ctx) => ({
      title: "Design an independent mini-study",
      summary: `Define a small piece of research, gather two or three insights and publish a short reflection that links directly to ${ctx.context}.`,
      source: INDEPENDENT_SOURCE,
      form: INDEPENDENT_FORM,
      focus: "experience"
    })
  },
  general: {
    edge: [
      (ctx) => ({
        title: "Attend a King's Edge professional storytelling workshop",
        summary: `Practice explaining ${ctx.context} in a workshop that shows how to translate experiences into compelling professional stories.`,
        source: EDGE_SOURCE,
        form: EDGE_FORMS[0],
        focus: "skills"
      }),
      (ctx) => ({
        title: "Connect with a King's Edge mentor",
        summary: `Use a mentoring slot to map networks, societies and activities that strengthen ${ctx.context}.`,
        source: EDGE_SOURCE,
        form: EDGE_FORMS[1],
        focus: "community"
      }),
      (ctx) => ({
        title: "Complete a short course on project planning",
        summary: `Work through a self-paced King's Edge short course that helps you break ${ctx.context} into achievable actions.`,
        source: EDGE_SOURCE,
        form: EDGE_FORMS[2],
        focus: "reflection"
      })
    ],
    independent: (ctx) => ({
      title: "Plan an independent action sprint",
      summary: `Choose one concrete action related to ${ctx.context}, schedule time this week and capture what you learned in a quick journal.`,
      source: INDEPENDENT_SOURCE,
      form: INDEPENDENT_FORM,
      focus: "experience"
    })
  }
}

const SCHOOL_KEYWORDS = ["school", "teach", "classroom", "teacher", "education"]
const RESEARCH_KEYWORDS = ["research", "lab", "study", "dissertation", "project"]

function detectTheme(stepTitle: string, intentionTitle?: string, bucket?: string): ThemeId {
  const haystack = `${stepTitle} ${intentionTitle ?? ""} ${bucket ?? ""}`.toLowerCase()

  if (SCHOOL_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "education"
  }

  if (RESEARCH_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "research"
  }

  return "general"
}

function buildContext(stepTitle: string, intentionTitle?: string): string {
  return intentionTitle && intentionTitle.trim().length > 0
    ? `${stepTitle} in the context of ${intentionTitle}`
    : stepTitle
}

export function createSimulatedOpportunityDrafts(args: {
  stepTitle: string
  intentionTitle?: string
  bucket?: string
}): OpportunityDraft[] {
  const stepTitle = args.stepTitle?.trim()

  if (!stepTitle) {
    throw new Error("stepTitle is required to simulate opportunities")
  }

  const intentionTitle = args.intentionTitle?.trim() || undefined
  const bucket = args.bucket?.trim() || undefined
  const context = buildContext(stepTitle, intentionTitle)
  const theme = detectTheme(stepTitle, intentionTitle, bucket)
  const draftContext: DraftContext = { stepTitle, intentionTitle, bucket, context }
  const templates = THEMES[theme]

  return [...templates.edge.map((factory) => factory(draftContext)), templates.independent(draftContext)]
}

export async function generateOpportunityDraftsForStep(params: {
  stepTitle: string
  intentionTitle?: string
  bucketId?: BucketId | string
}): Promise<OpportunityDraft[]> {
  const { stepTitle, intentionTitle, bucketId } = params
  return createSimulatedOpportunityDrafts({ stepTitle, intentionTitle, bucket: bucketId ? String(bucketId) : undefined })
}
