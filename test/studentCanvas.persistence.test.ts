import { toCanonicalIntentionsFromUnknown } from "@/lib/studentCanvas/mappers"
import { validateStudentCanvasDocument } from "@/lib/studentCanvas/validation"

describe("student canvas persistence normalization", () => {
  it("normalizes UI-shaped autosave payloads into schema-compliant canonical records", () => {
    const canonicalIntentions = toCanonicalIntentionsFromUnknown([
      {
        id: "int-1710000000000",
        title: "Build my portfolio",
        description: "Collect evidence for future roles",
        bucket: "do-later",
        createdAt: "2026-05-06T08:00:00.000Z",
        updatedAt: "2026-05-06T08:00:00.000Z",
        steps: [
          {
            id: "",
            clientId: "step-1710000000001",
            title: "Draft case study",
            text: "Draft case study",
            bucket: "do-now",
            order: 1,
            status: "active",
            createdAt: "2026-05-06T08:01:00.000Z",
          },
        ],
      },
    ])

    const result = validateStudentCanvasDocument({
      schema_version: "1.0.0",
      student_id: "student@example.com",
      created_at: "2026-05-06T08:00:00.000Z",
      updated_at: "2026-05-06T08:02:00.000Z",
      canvas: { intentions: canonicalIntentions },
    })

    expect(result).toEqual({ valid: true, issues: [] })
    expect(canonicalIntentions[0].id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(canonicalIntentions[0].bucket).toBe("do_later")
    expect(canonicalIntentions[0].steps[0].id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(canonicalIntentions[0].steps[0].bucket).toBe("do_now")
    expect(canonicalIntentions[0].steps[0].progress_status).toBe("in_progress")
  })

  it("repairs legacy primary documents that already carry schema_version 1.0.0", () => {
    const canonicalIntentions = toCanonicalIntentionsFromUnknown([
      {
        id: "legacy-intention-id",
        title: "Find internships",
        bucket: "before-graduation",
        progress_status: "accepted",
        created_at: "2026-05-06T08:00:00.000Z",
        updated_at: "2026-05-06T08:00:00.000Z",
        steps: [
          {
            id: "legacy-step-id",
            title: "Update CV",
            bucket: "do-later",
            order: 0,
            status: "accepted",
            createdAt: "2026-05-06T08:01:00.000Z",
            opportunities: [
              {
                id: "legacy-opportunity-id",
                title: "Careers fair",
                summary: "Meet employers on campus.",
                status: "saved",
                source: "kings-edge-simulated",
                createdAt: "2026-05-06T08:02:00.000Z",
              },
            ],
          },
        ],
      },
    ])

    const result = validateStudentCanvasDocument({
      schema_version: "1.0.0",
      student_id: "student@example.com",
      created_at: "2026-05-06T08:00:00.000Z",
      updated_at: "2026-05-06T08:03:00.000Z",
      canvas: { intentions: canonicalIntentions },
    })

    expect(result.valid).toBe(true)
    expect(canonicalIntentions[0].bucket).toBe("before_graduation")
    expect(canonicalIntentions[0].progress_status).toBe("in_progress")
    expect(canonicalIntentions[0].steps[0].bucket).toBe("do_later")
    expect(canonicalIntentions[0].steps[0].opportunities[0]).toMatchObject({
      decision_status: "accepted",
      progress_status: "not_started",
      source: "catalogue",
      catalogue_ref: expect.objectContaining({ system: "legacy-opportunity" }),
    })
  })
})
