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

export type OpportunityTheme = "teaching" | "research" | "health" | "enterprise" | "community" | "general"

type OpportunityBucket = "do-now" | "do-later" | "before-i-graduate" | "after-i-graduate"

type TemplateBuildArgs = {
  stepTitle: string
  intentionTitle?: string
  bucket: OpportunityBucket
}

type EdgeTemplate = {
  title: string
  form: OpportunityForm
  focus: OpportunityFocus
  summary: (args: TemplateBuildArgs) => string
}

type IndependentTemplate = {
  title: string
  focus: OpportunityFocus
  summary: (args: TemplateBuildArgs) => string
}

const EDGE_SOURCE: OpportunitySource = "kings-edge-simulated"
const INDEPENDENT_SOURCE: OpportunitySource = "independent"
const INDEPENDENT_FORM: OpportunityForm = "independent-action"

const BUCKET_FALLBACK: OpportunityBucket = "do-now"

const BUCKET_ALIASES: Record<string, OpportunityBucket> = {
  "do-now": "do-now",
  "donow": "do-now",
  now: "do-now",
  "do_later": "do-later",
  "do-later": "do-later",
  later: "do-later",
  "before-i-graduate": "before-i-graduate",
  "before_i_graduate": "before-i-graduate",
  "before-graduation": "before-i-graduate",
  "before_graduation": "before-i-graduate",
  "after-i-graduate": "after-i-graduate",
  "after_i_graduate": "after-i-graduate",
  "after-graduation": "after-i-graduate",
  "after_graduation": "after-i-graduate"
}

const THEME_KEYWORDS: Record<OpportunityTheme, string[]> = {
  teaching: ["school", "teach", "classroom", "teacher", "education", "pgce"],
  research: ["research", "lab", "study", "dissertation", "project", "supervisor"],
  health: ["health", "clinic", "hospital", "patient", "nhs", "care"],
  enterprise: ["business", "enterprise", "startup", "start-up", "venture", "innovation"],
  community: ["community", "volunteer", "society", "union", "civic", "charity"],
  general: []
}

const BUCKET_TIME_HINTS: Record<OpportunityBucket, string> = {
  "do-now": "Start this within the next fortnight so you can act while the idea is fresh.",
  "do-later": "Line this up for the next term so it is ready when your timetable opens up.",
  "before-i-graduate": "Treat it as a capstone commitment before you finish at King's.",
  "after-i-graduate": "Use it to stay in motion as you transition after graduation."
}

const EDGE_TEMPLATE_LIBRARY: Record<OpportunityTheme, Record<OpportunityBucket, EdgeTemplate[]>> = {
  teaching: {
    "do-now": [
      {
        title: "Join a King's Edge taster on routes into teaching",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) =>
          `Take part in a simulated King's Edge taster session that links “${stepTitle}” to immediate ways of gaining classroom experience.`
      },
      {
        title: "Support a King's outreach visit to a local school",
        form: "project",
        focus: "experience",
        summary: ({ bucket }) =>
          `Shadow a simulated King's Edge outreach visit in the next few weeks, helping deliver an activity and reflecting on what makes a great session for a ${bucket === "do-now" ? "trial" : "practice"}.`
      },
      {
        title: "Book a one to one to map your teaching pathway",
        form: "coaching",
        focus: "reflection",
        summary: ({ stepTitle, intentionTitle }) =>
          `Use a simulated King's Edge coaching appointment to connect “${stepTitle}” with modules, part time work and volunteering${
            intentionTitle ? ` linked to ${intentionTitle}` : ""
          }.`
      }
    ],
    "do-later": [
      {
        title: "Reserve a King's Edge classroom assistant workshop",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) =>
          `Plan ahead for a term-time workshop on behaviour management so you can practise techniques that feed into “${stepTitle}”.`
      },
      {
        title: "Pair with a King's Edge supported tutoring project",
        form: "project",
        focus: "experience",
        summary: () => `Line up a tutoring commitment for next term where you stretch your responsibility with support from King's Edge.`
      },
      {
        title: "Schedule King's Edge coaching to line up school commitments",
        form: "coaching",
        focus: "planning",
        summary: () => "Work through a coaching session that sets milestones for securing placements, references and lesson ideas over the next term."
      }
    ],
    "before-i-graduate": [
      {
        title: "Complete a King's Edge micro-credential in education practice",
        form: "short-course",
        focus: "skills",
        summary: ({ stepTitle }) =>
          `Earn a micro-credential focused on education practice so you can evidence “${stepTitle}” when you apply for teacher training.`
      },
      {
        title: "Lead a school based project through King's Edge",
        form: "project",
        focus: "experience",
        summary: () =>
          "Take ownership of a King's Edge partner school project where you design activity plans, brief volunteers and evaluate impact."
      },
      {
        title: "Prepare a teaching focused portfolio with King's Edge",
        form: "mentoring",
        focus: "reflection",
        summary: ({ stepTitle }) => `Work with a mentor to curate reflections, lesson resources and evidence that show how “${stepTitle}” has grown over time.`
      }
    ],
    "after-i-graduate": [
      {
        title: "Join a King's Edge transition session for teaching routes",
        form: "workshop",
        focus: "skills",
        summary: () => "Attend an alumni focused session exploring teacher training routes, funding and early career expectations."
      },
      {
        title: "Apply for a King's Edge alumni teaching residency",
        form: "project",
        focus: "experience",
        summary: () => "Work with King's Edge staff on a simulated residency project where graduates support a local school over a half term."
      },
      {
        title: "Work with a King's Edge coach on early career teaching plans",
        form: "coaching",
        focus: "planning",
        summary: ({ stepTitle }) => `Build a first-year teaching plan that keeps “${stepTitle}” progressing once you finish at King's.`
      }
    ]
  },
  research: {
    "do-now": [
      {
        title: "Join a King's Edge briefing on research questions",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) => `Explore how to refine research questions and methods so “${stepTitle}” can move from an idea into action.`
      },
      {
        title: "Contribute to a King's Edge mini-study",
        form: "project",
        focus: "experience",
        summary: () => "Sign up for a short simulated study where you collect data with a small peer team and practice documenting insights."
      },
      {
        title: "Book King's Edge coaching on your research plan",
        form: "coaching",
        focus: "reflection",
        summary: ({ intentionTitle }) =>
          `Use a coaching slot to connect methods, supervisors and resources${intentionTitle ? ` for ${intentionTitle}` : ""}.`
      }
    ],
    "do-later": [
      {
        title: "Reserve a King's Edge data skills workshop",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) => `Schedule a next-term workshop to improve analysis tools you can apply when progressing “${stepTitle}”.`
      },
      {
        title: "Shadow a King's Edge supervisor-led project",
        form: "project",
        focus: "experience",
        summary: () => "Pair with an academic-led mini project where you practice setting research rhythms over a whole term."
      },
      {
        title: "Join a King's Edge mentoring clinic to scope your study",
        form: "mentoring",
        focus: "planning",
        summary: () => "Map deliverables, ethics checkpoints and dissemination moments for the study you want to line up."
      }
    ],
    "before-i-graduate": [
      {
        title: "Complete a King's Edge research methods micro-credential",
        form: "short-course",
        focus: "skills",
        summary: ({ stepTitle }) => `Evidence advanced research methods that directly support “${stepTitle}” when you apply for postgraduate roles.`
      },
      {
        title: "Lead a King's Edge research dissemination project",
        form: "project",
        focus: "experience",
        summary: () => "Design a showcase or publication plan that helps peers understand your findings and impact."
      },
      {
        title: "Assemble a research showcase portfolio",
        form: "mentoring",
        focus: "reflection",
        summary: () => "Work alongside a mentor to curate abstracts, posters and commentary that prove your readiness for research careers."
      }
    ],
    "after-i-graduate": [
      {
        title: "Attend a King's Edge early career researcher forum",
        form: "networking",
        focus: "community",
        summary: () => "Connect with alumni researchers, hear what early roles look like and expand your professional network."
      },
      {
        title: "Collaborate on a King's Edge alumni research challenge",
        form: "project",
        focus: "experience",
        summary: () => "Tackle a themed challenge with other graduates to keep your research practice active."
      },
      {
        title: "Work with King's Edge coaching on postgrad research plans",
        form: "coaching",
        focus: "planning",
        summary: ({ stepTitle }) => `Create a 6–12 month plan for sustaining “${stepTitle}” as you move into early career roles.`
      }
    ]
  },
  health: {
    "do-now": [
      {
        title: "Join a King's Edge workshop on patient communication",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) => `Practise scenario-based communication so you feel ready for “${stepTitle}” in real settings.`
      },
      {
        title: "Assist with a simulated clinic outreach shift",
        form: "project",
        focus: "experience",
        summary: () => "Take on a short outreach shift that mirrors work with patients or service users and reflect with facilitators afterwards."
      },
      {
        title: "Book reflective coaching on your health pathway",
        form: "coaching",
        focus: "reflection",
        summary: ({ intentionTitle }) =>
          `Use a coaching slot to understand how placements, study and volunteering combine${intentionTitle ? ` for ${intentionTitle}` : ""}.`
      }
    ],
    "do-later": [
      {
        title: "Reserve a King's Edge short course on health tech",
        form: "short-course",
        focus: "skills",
        summary: ({ stepTitle }) => `Spend next term building confidence with tools and data that support “${stepTitle}”.`
      },
      {
        title: "Plan a King's Edge health promotion project",
        form: "project",
        focus: "experience",
        summary: () => "Co-design a community health campaign where you trial interventions with guidance from King's Edge."
      },
      {
        title: "Meet a King's Edge mentor from clinical placements",
        form: "mentoring",
        focus: "reflection",
        summary: () => "Learn how other students balance shifts, study and wellbeing before you commit to a longer placement."
      }
    ],
    "before-i-graduate": [
      {
        title: "Complete a King's Edge patient care micro-credential",
        form: "short-course",
        focus: "skills",
        summary: ({ stepTitle }) => `Gain credentialed evidence of patient-centred care that underpins “${stepTitle}”.`
      },
      {
        title: "Lead a health innovation project with King's Edge",
        form: "project",
        focus: "experience",
        summary: () => "Run a multi-week project addressing a health challenge with peers from different disciplines."
      },
      {
        title: "Curate a reflective health practice portfolio",
        form: "mentoring",
        focus: "reflection",
        summary: () => "Gather case notes, feedback and insights from your experiences to showcase to future supervisors."
      }
    ],
    "after-i-graduate": [
      {
        title: "Attend a King's Edge transition workshop for new health professionals",
        form: "workshop",
        focus: "skills",
        summary: () => "Explore induction expectations, supervision models and wellbeing plans for your first year post-graduation."
      },
      {
        title: "Join a King's Edge alumni community health project",
        form: "project",
        focus: "community",
        summary: () => "Collaborate with graduates to deliver a community health initiative in partnership with local organisations."
      },
      {
        title: "Work with a King's Edge coach on early career health plans",
        form: "coaching",
        focus: "planning",
        summary: ({ stepTitle }) => `Draft a rotation and development plan that keeps “${stepTitle}” moving after King's.`
      }
    ]
  },
  enterprise: {
    "do-now": [
      {
        title: "Join a King's Edge idea generation sprint",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) => `Rapidly test propositions for “${stepTitle}” alongside other founders-in-training.`
      },
      {
        title: "Prototype a King's Edge venture challenge",
        form: "project",
        focus: "experience",
        summary: () => "Form a small squad to run a one-week experiment, capture feedback and decide the next iteration."
      },
      {
        title: "Book King's Edge coaching on your offer",
        form: "coaching",
        focus: "planning",
        summary: () => "Spend an hour clarifying customer promises, measures of success and near-term targets."
      }
    ],
    "do-later": [
      {
        title: "Reserve a King's Edge market validation workshop",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) => `Plan a masterclass that helps you collect evidence for “${stepTitle}” during the next term.`
      },
      {
        title: "Apply to a King's Edge incubator style project",
        form: "project",
        focus: "experience",
        summary: () => "Line up a term-long incubator where you test governance, finances and brand positioning with mentors."
      },
      {
        title: "Schedule mentoring to map investment-ready milestones",
        form: "mentoring",
        focus: "planning",
        summary: () => "Work backwards from a future pitch to identify the experiments and partnerships you need this year."
      }
    ],
    "before-i-graduate": [
      {
        title: "Complete a King's Edge venture building short course",
        form: "short-course",
        focus: "skills",
        summary: ({ stepTitle }) => `Build a capstone-quality toolkit for growing “${stepTitle}” into a credible venture.`
      },
      {
        title: "Lead a student enterprise project via King's Edge",
        form: "project",
        focus: "experience",
        summary: () => "Coordinate a multi-disciplinary project with real budgets, customers and feedback loops."
      },
      {
        title: "Prepare a pitch portfolio with King's Edge mentoring",
        form: "mentoring",
        focus: "reflection",
        summary: () => "Curate decks, prototypes and stories that prove traction when you meet investors or partners."
      }
    ],
    "after-i-graduate": [
      {
        title: "Attend a King's Edge alumni founder networking circle",
        form: "networking",
        focus: "community",
        summary: () => "Meet other graduate founders, swap supplier contacts and hear what early revenue journeys look like."
      },
      {
        title: "Join a King's Edge alumni accelerator sprint",
        form: "project",
        focus: "experience",
        summary: () => "Commit to a short, intense sprint with clear accountability to keep your venture momentum after graduation."
      },
      {
        title: "Work with King's Edge coaching on post-grad venture plans",
        form: "coaching",
        focus: "planning",
        summary: ({ stepTitle }) => `Set twelve-week growth goals so “${stepTitle}” continues as you enter early career life.`
      }
    ]
  },
  community: {
    "do-now": [
      {
        title: "Join a King's Edge community action workshop",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) => `Explore facilitation tools you can apply to “${stepTitle}” in the next few weeks.`
      },
      {
        title: "Support a King's Edge local partnership project",
        form: "project",
        focus: "community",
        summary: () => "Take on a bite-sized volunteering challenge with peers and reflect on community impact together."
      },
      {
        title: "Book King's Edge mentoring to map community roles",
        form: "mentoring",
        focus: "planning",
        summary: () => "Plan how societies, networks and neighbourhood groups can plug into your idea."
      }
    ],
    "do-later": [
      {
        title: "Reserve a King's Edge volunteer leadership workshop",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) => `Schedule leadership training so you can run “${stepTitle}” next term with confidence.`
      },
      {
        title: "Plan a term-long King's Edge volunteering project",
        form: "project",
        focus: "community",
        summary: () => "Design a structured programme with partners, budgeting time and impact goals for the term."
      },
      {
        title: "Meet with King's Edge coaching to align societies",
        form: "coaching",
        focus: "planning",
        summary: () => "Coordinate cross-society collaboration and map stakeholder asks ahead of delivery."
      }
    ],
    "before-i-graduate": [
      {
        title: "Complete a King's Edge civic leadership short course",
        form: "short-course",
        focus: "skills",
        summary: ({ stepTitle }) => `Gain recognised training in civic leadership that underlines “${stepTitle}”.`
      },
      {
        title: "Lead a community change project via King's Edge",
        form: "project",
        focus: "community",
        summary: () => "Deliver a substantial social impact project with monitoring, evaluation and storytelling."
      },
      {
        title: "Curate a reflective community impact portfolio",
        form: "mentoring",
        focus: "reflection",
        summary: () => "Capture case studies, testimonies and metrics that evidence the change you have led."
      }
    ],
    "after-i-graduate": [
      {
        title: "Attend a King's Edge alumni civic impact meetup",
        form: "networking",
        focus: "community",
        summary: () => "Connect with alumni working in charities, councils and social enterprises to stay plugged in."
      },
      {
        title: "Join a King's Edge alumni community partnership sprint",
        form: "project",
        focus: "community",
        summary: () => "Work with graduates on a short civic challenge with clear deliverables and reflection."
      },
      {
        title: "Work with King's Edge coaching on post-grad civic plans",
        form: "coaching",
        focus: "planning",
        summary: ({ stepTitle }) => `Create a roadmap for keeping “${stepTitle}” alive as you settle into work or further study.`
      }
    ]
  },
  general: {
    "do-now": [
      {
        title: "Join a King's Edge professional storytelling workshop",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) => `Practise telling the story of “${stepTitle}” so you can explain it clearly to staff and employers.`
      },
      {
        title: "Take on a King's Edge mini project shadow",
        form: "project",
        focus: "experience",
        summary: () => "Spend a week shadowing a cross-disciplinary project team and contribute a small deliverable."
      },
      {
        title: "Book King's Edge coaching for quick reflection",
        form: "coaching",
        focus: "reflection",
        summary: () => "Capture what you are learning now and log actions to keep momentum."
      }
    ],
    "do-later": [
      {
        title: "Reserve a King's Edge skills studio",
        form: "workshop",
        focus: "skills",
        summary: ({ stepTitle }) => `Line up a studio-style workshop next term to rehearse the presentations or demos linked to “${stepTitle}”.`
      },
      {
        title: "Plan a King's Edge cross-discipline project",
        form: "project",
        focus: "experience",
        summary: () => "Bring together peers from multiple courses to tackle a shared brief over the term."
      },
      {
        title: "Schedule mentoring to map your medium-term plan",
        form: "mentoring",
        focus: "planning",
        summary: () => "Translate ambitions into milestones covering skills, evidence and supporters."
      }
    ],
    "before-i-graduate": [
      {
        title: "Complete a King's Edge professional micro-credential",
        form: "short-course",
        focus: "skills",
        summary: ({ stepTitle }) => `Gain a credential that proves how “${stepTitle}” has developed your professional practice.`
      },
      {
        title: "Lead a King's Edge showcase project",
        form: "project",
        focus: "experience",
        summary: () => "Coordinate a showcase with partners, comms and evaluation before you leave King's."
      },
      {
        title: "Curate a portfolio review with King's Edge",
        form: "mentoring",
        focus: "reflection",
        summary: () => "Gather artefacts, testimonials and next steps ready for graduate applications."
      }
    ],
    "after-i-graduate": [
      {
        title: "Attend a King's Edge alumni networking salon",
        form: "networking",
        focus: "community",
        summary: () => "Meet alumni from different sectors to exchange tactics for the first year after graduation."
      },
      {
        title: "Join a King's Edge alumni transition project",
        form: "project",
        focus: "experience",
        summary: () => "Collaborate on a short consultancy-style brief that keeps your skills sharp between applications."
      },
      {
        title: "Work with King's Edge coaching on a first-year-out plan",
        form: "coaching",
        focus: "planning",
        summary: ({ stepTitle }) => `Create a personal roadmap so “${stepTitle}” keeps evolving once you're alumni.`
      }
    ]
  }
}

const INDEPENDENT_TEMPLATE_LIBRARY: Record<OpportunityTheme, IndependentTemplate> = {
  teaching: {
    title: "Arrange independent classroom volunteering",
    focus: "experience",
    summary: ({ stepTitle, bucket }) =>
      `Identify a local school, homework club or youth organisation and offer to support a regular session so you can practise skills linked to “${stepTitle}”. ${BUCKET_TIME_HINTS[bucket]}`
  },
  research: {
    title: "Design a small independent research mini project",
    focus: "skills",
    summary: ({ stepTitle, bucket }) =>
      `Agree a focused question with a tutor or peer, run a mini study on “${stepTitle}” and capture notes for future applications. ${BUCKET_TIME_HINTS[bucket]}`
  },
  health: {
    title: "Arrange independent health or wellbeing volunteering",
    focus: "experience",
    summary: ({ stepTitle, bucket }) =>
      `Offer time to a local clinic, helpline or wellbeing charity so you can observe and contribute to services connected to “${stepTitle}”. ${BUCKET_TIME_HINTS[bucket]}`
  },
  enterprise: {
    title: "Run a small independent test of your idea",
    focus: "experience",
    summary: ({ stepTitle, bucket }) =>
      `Prototype a simple version of your idea, share it with potential users and log what it means for “${stepTitle}”. ${BUCKET_TIME_HINTS[bucket]}`
  },
  community: {
    title: "Organise an independent community action",
    focus: "community",
    summary: ({ stepTitle, bucket }) =>
      `Choose a local cause, gather a few peers and deliver a small activity tied to “${stepTitle}”, capturing what the community needs next. ${BUCKET_TIME_HINTS[bucket]}`
  },
  general: {
    title: "Plan and complete a small independent action",
    focus: "planning",
    summary: ({ stepTitle, bucket }) =>
      `Select one achievable action related to “${stepTitle}”, schedule it and record what you learn in a short reflection. ${BUCKET_TIME_HINTS[bucket]}`
  }
}

function formatHaystack(stepTitle: string, intentionTitle?: string): string {
  return `${stepTitle} ${intentionTitle ?? ""}`.toLowerCase()
}

export function inferTheme(stepTitle: string, intentionTitle?: string): OpportunityTheme {
  const haystack = formatHaystack(stepTitle, intentionTitle)

  for (const theme of ["teaching", "research", "health", "enterprise", "community"] as OpportunityTheme[]) {
    const keywords = THEME_KEYWORDS[theme]
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return theme
    }
  }

  return "general"
}

function normalizeBucket(bucket?: string): OpportunityBucket {
  if (!bucket) {
    return BUCKET_FALLBACK
  }

  const key = bucket.toLowerCase().replace(/\s+/g, "-")
  return BUCKET_ALIASES[key] ?? BUCKET_FALLBACK
}

function buildEdgeDraftsForThemeAndBucket(args: {
  theme: OpportunityTheme
  bucket: OpportunityBucket
  stepTitle: string
  intentionTitle?: string
}): OpportunityDraft[] {
  const { theme, bucket, stepTitle, intentionTitle } = args
  const templates = EDGE_TEMPLATE_LIBRARY[theme][bucket]

  return templates.map((template) => ({
    title: template.title,
    summary: template.summary({ stepTitle, intentionTitle, bucket }),
    source: EDGE_SOURCE,
    form: template.form,
    focus: template.focus
  }))
}

export function createIndependentActionDraft(args: {
  stepTitle: string
  theme: OpportunityTheme
  bucket: OpportunityBucket
}): OpportunityDraft {
  const { stepTitle, theme, bucket } = args
  const template = INDEPENDENT_TEMPLATE_LIBRARY[theme]
  return {
    title: template.title,
    summary: template.summary({ stepTitle, bucket }),
    source: INDEPENDENT_SOURCE,
    form: INDEPENDENT_FORM,
    focus: template.focus
  }
}

export function createSimulatedOpportunityDrafts(args: {
  stepTitle: string
  intentionTitle?: string
  bucket?: string
  theme?: OpportunityTheme
}): OpportunityDraft[] {
  const stepTitle = args.stepTitle?.trim()

  if (!stepTitle) {
    throw new Error("stepTitle is required to simulate opportunities")
  }

  const intentionTitle = args.intentionTitle?.trim() || undefined
  const bucket = normalizeBucket(args.bucket)
  const theme = args.theme ?? inferTheme(stepTitle, intentionTitle)

  const edgeDrafts = buildEdgeDraftsForThemeAndBucket({ theme, bucket, stepTitle, intentionTitle })
  const independentDraft = createIndependentActionDraft({ stepTitle, theme, bucket })

  return [...edgeDrafts, independentDraft]
}

export async function generateOpportunityDraftsForStep(params: {
  stepTitle: string
  intentionTitle?: string
  bucketId?: BucketId | string
}): Promise<OpportunityDraft[]> {
  const { stepTitle, intentionTitle, bucketId } = params
  return createSimulatedOpportunityDrafts({
    stepTitle,
    intentionTitle,
    bucket: bucketId ? String(bucketId) : undefined
  })
}
