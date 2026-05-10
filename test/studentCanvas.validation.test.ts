import { isOpportunitySchemaCompliant } from '@/lib/studentCanvas/opportunityRules'

describe('student canvas opportunity invariants', () => {
  it('accepts catalogue opportunities only when catalogue_ref is present', () => {
    expect(
      isOpportunitySchemaCompliant({
        source: 'catalogue',
        decision_status: 'suggested',
        catalogue_ref: { system: 'kings-edge-simulated', id: 'intro-workshop' },
      })
    ).toBe(true)
  })

  it('rejects catalogue opportunities without catalogue_ref', () => {
    expect(
      isOpportunitySchemaCompliant({
        source: 'catalogue',
        decision_status: 'suggested',
      })
    ).toBe(false)
  })

  it('rejects free_text opportunities when catalogue_ref is present', () => {
    expect(
      isOpportunitySchemaCompliant({
        source: 'free_text',
        decision_status: 'suggested',
        catalogue_ref: { system: 'kings-edge-simulated', id: 'invalid' },
      })
    ).toBe(false)
  })

  it('rejects progress_status when decision_status is not accepted', () => {
    expect(
      isOpportunitySchemaCompliant({
        source: 'free_text',
        decision_status: 'suggested',
        progress_status: 'in_progress',
      })
    ).toBe(false)
  })
})
