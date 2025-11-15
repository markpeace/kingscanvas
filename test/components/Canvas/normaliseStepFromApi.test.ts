import { normaliseStepFromApi } from '@/components/Canvas/Canvas'

describe('normaliseStepFromApi', () => {
  it('keeps the backend _id on the mapped step', () => {
    const result = normaliseStepFromApi(
      {
        _id: 'abc123',
        id: 'step-temp',
        intentionId: 'int-1',
        bucket: 'do-now',
        order: 1,
        title: 'Persisted step'
      },
      'int-1',
      0
    )

    expect(result._id).toBe('abc123')
    expect(result.id).toBe('step-temp')
  })

  it('falls back to a generated client id when none provided', () => {
    const result = normaliseStepFromApi(
      {
        _id: 'xyz789',
        intentionId: 'int-2',
        bucket: 'do-now',
        order: 1,
        title: 'Generated client id'
      },
      'int-2',
      1
    )

    expect(result._id).toBe('xyz789')
    expect(result.id).toBe('step-xyz789')
  })
})
