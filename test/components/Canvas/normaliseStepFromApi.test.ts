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

    expect(result.id).toBe('abc123')
    expect(result.clientId).toBe('step-temp')
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

    expect(result.id).toBe('xyz789')
    expect(result.clientId).toBe('step-xyz789')
  })

  it('coerces object id values to strings', () => {
    const fakeObjectId = {
      toString: () => '507f1f77bcf86cd799439011'
    }

    const result = normaliseStepFromApi(
      {
        _id: fakeObjectId as any,
        intentionId: 'int-3',
        bucket: 'do-now',
        order: 2,
        title: 'Object id step'
      },
      'int-3',
      2
    )

    expect(result.id).toBe('507f1f77bcf86cd799439011')
    expect(result.clientId).toBe('step-507f1f77bcf86cd799439011')
  })
})
