import { useMemo } from 'react'

export type FakeOpportunity = {
  id: string
  title: string
  summary: string
  form?: string
  focus?: string
}

const SAMPLE_OPPORTUNITIES: FakeOpportunity[] = [
  {
    id: 'opportunity-mentoring',
    title: "King's Edge Mentoring Circle",
    summary: 'Join a small peer group to develop leadership habits with support from alumni mentors.',
    form: 'In person',
    focus: 'Leadership'
  },
  {
    id: 'opportunity-research',
    title: 'Undergraduate Research Assistant Scheme',
    summary: 'Spend a term supporting a faculty research project and build your academic portfolio.',
    form: 'Part-time',
    focus: 'Research'
  },
  {
    id: 'opportunity-volunteering',
    title: 'Community Volunteering Sprint',
    summary: 'A four-week challenge to apply your skills with local partners and reflect on your impact.',
    form: 'Hybrid',
    focus: 'Community'
  },
  {
    id: 'opportunity-workshop',
    title: 'Career Confidence Workshop',
    summary: 'Interactive coaching on storytelling, portfolio building, and articulating your strengths.',
    form: 'Virtual',
    focus: 'Careers'
  }
]

function buildFakeOpportunities(stepId: string): FakeOpportunity[] {
  if (!stepId) {
    return []
  }

  const normalisedId = stepId.toLowerCase()
  const hash = Array.from(normalisedId).reduce((total, char) => total + char.charCodeAt(0), 0)
  const count = hash % (SAMPLE_OPPORTUNITIES.length + 1)

  return SAMPLE_OPPORTUNITIES.slice(0, count).map((opportunity, index) => ({
    ...opportunity,
    id: `${opportunity.id}-${stepId}-${index}`
  }))
}

export function useFakeOpportunities(stepId: string) {
  return useMemo(() => {
    const opportunities = buildFakeOpportunities(stepId)
    return {
      opportunities,
      count: opportunities.length
    }
  }, [stepId])
}
