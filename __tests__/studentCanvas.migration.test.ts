import { assembleCanonicalDocument } from "@/lib/studentCanvas/migration"
import { validateStudentCanvasDocument } from "@/lib/studentCanvas/validation"

describe("student canvas migration", () => {
  test("normalizes legacy ids, buckets, statuses, and timestamps", () => {
    const { document, stats } = assembleCanonicalDocument("student-1", {
      intentionsDoc: {
        user: "student-1",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-02-01T00:00:00Z"),
        intentions: [
          {
            id: "legacy-intention-1",
            title: "Find internships",
            bucket: "do-later",
            progress_status: "accepted",
            created_at: "2024-01-05T00:00:00Z",
            updated_at: "2024-01-06T00:00:00Z",
          } as any,
        ],
      },
      steps: [
        {
          _id: "legacy-step-db-id",
          user: "student-1",
          intentionId: "legacy-intention-1",
          text: "Update CV",
          bucket: "before-graduation",
          status: "accepted",
          order: 2,
          createdAt: "2024-01-10T00:00:00Z",
          updatedAt: "2024-01-11T00:00:00Z",
        },
      ],
      opportunities: [
        {
          _id: "legacy-opportunity-1",
          user: "student-1",
          stepId: "legacy-step-db-id",
          title: "Attend careers fair",
          source: "kings-edge-simulated",
          status: "saved",
          createdAt: "2024-01-12T00:00:00Z",
          updatedAt: "2024-01-13T00:00:00Z",
        },
      ],
    })

    expect(document).not.toBeNull()
    expect(document?.schema_version).toBe("1.0.0")
    expect(validateStudentCanvasDocument(document).valid).toBe(true)
    expect(document?.canvas.intentions).toHaveLength(1)

    const intention = document!.canvas.intentions[0]
    expect(intention.id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(intention.bucket).toBe("do_later")
    expect(intention.progress_status).toBe("in_progress")

    const step = intention.steps[0]
    expect(step.id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(step.bucket).toBe("before_graduation")
    expect(step.progress_status).toBe("in_progress")

    const opportunity = step.opportunities[0]
    expect(opportunity.id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(opportunity.decision_status).toBe("accepted")
    expect(opportunity.source).toBe("catalogue")

    expect(stats.intentions_migrated).toBe(1)
    expect(stats.steps_migrated).toBe(1)
    expect(stats.opportunities_migrated).toBe(1)
    expect(stats.rejects).toEqual([])
  })

  test("captures reject reasons when relationship references are invalid", () => {
    const { document, stats } = assembleCanonicalDocument("student-2", {
      intentionsDoc: {
        user: "student-2",
        intentions: [],
      },
      steps: [
        {
          _id: "step-no-intention",
          user: "student-2",
        },
      ],
      opportunities: [
        {
          _id: "opportunity-no-step",
          user: "student-2",
          stepId: "missing-step",
        },
      ],
    })

    expect(document).not.toBeNull()
    expect(stats.steps_migrated).toBe(0)
    expect(stats.opportunities_migrated).toBe(0)
    expect(stats.rejects).toEqual([
      {
        entity: "step",
        legacy_id: "step-no-intention",
        reason: "missing_intention_id",
      },
      {
        entity: "opportunity",
        legacy_id: "opportunity-no-step",
        reason: "step_not_found:missing-step",
      },
    ])
  })
})

test("rejects documents that do not follow the student canvas storage schema", () => {
  const result = validateStudentCanvasDocument({
    schema_version: "1.0.0",
    student_id: "student-3",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    canvas: {
      intentions: [
        {
          id: "not-a-uuid",
          title: "Invalid intention",
          bucket: "do-now",
          progress_status: "accepted",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
          steps: [],
        },
      ],
    },
  })

  expect(result.valid).toBe(false)
  expect(result.issues.map((issue) => issue.path)).toEqual(
    expect.arrayContaining([
      "/canvas/intentions/0/id",
      "/canvas/intentions/0/bucket",
      "/canvas/intentions/0/progress_status",
    ])
  )
})
