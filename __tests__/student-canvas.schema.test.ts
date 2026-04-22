import {
  buildStudentCanvasDocument,
  parseStudentCanvasDocument,
  toLegacyIntentionsPayload,
} from "@/lib/studentCanvas"

describe("studentCanvas contract mapping", () => {
  it("builds a canonical v1 document from legacy intentions payload", () => {
    const doc = buildStudentCanvasDocument("k123", {
      intentions: [
        {
          id: "int-1",
          title: "Grow network",
          bucket: "before-graduation",
          steps: [
            {
              id: "step-1",
              text: "Attend one event",
              bucket: "do-now",
              order: 0,
              status: "accepted",
            },
          ],
        },
      ],
    })

    expect(doc.schema_version).toBe("1.0.0")
    expect(doc.student_id).toBe("k123")
    expect(doc.canvas.intentions).toHaveLength(1)
    expect(doc.canvas.intentions[0].bucket).toBe("before_graduation")
    expect(doc.canvas.intentions[0].steps[0].bucket).toBe("do_now")
    expect(doc.canvas.intentions[0].steps[0].progress_status).toBe("completed")
    expect(doc.canvas.intentions[0].steps[0].opportunities).toEqual([])
  })

  it("maps canonical storage back to legacy payload for existing clients", () => {
    const canonical = buildStudentCanvasDocument("k123", {
      intentions: [
        {
          id: "a",
          title: "Title",
          bucket: "do-now",
          steps: [{ id: "b", text: "Step", bucket: "do-later", order: 0 }],
        },
      ],
    })

    const legacy = toLegacyIntentionsPayload(canonical)

    expect(legacy.intentions).toHaveLength(1)
    expect(legacy.intentions[0].bucket).toBe("do-now")
    expect(legacy.intentions[0].steps[0].bucket).toBe("do-later")
    expect(typeof legacy.intentions[0].id).toBe("string")
  })

  it("returns null for invalid canonical documents", () => {
    const parsed = parseStudentCanvasDocument({ schema_version: "0.0.1" })
    expect(parsed).toBeNull()
  })
})
