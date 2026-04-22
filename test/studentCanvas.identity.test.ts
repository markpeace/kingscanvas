import { canonicalIdFromLegacyRef, createCanonicalId, isCanonicalId } from '@/lib/studentCanvas/identity'

describe('studentCanvas identity utilities', () => {
  it('creates UUID ids', () => {
    const id = createCanonicalId()
    expect(isCanonicalId(id)).toBe(true)
  })

  it('maps legacy refs to stable scoped UUID ids', () => {
    const stepA = canonicalIdFromLegacyRef('507f1f77bcf86cd799439011', 'step')
    const stepB = canonicalIdFromLegacyRef('507f1f77bcf86cd799439011', 'step')
    const opp = canonicalIdFromLegacyRef('507f1f77bcf86cd799439011', 'opportunity')

    expect(stepA).toBe(stepB)
    expect(stepA).not.toBe(opp)
    expect(isCanonicalId(stepA)).toBe(true)
    expect(isCanonicalId(opp)).toBe(true)
  })
})
