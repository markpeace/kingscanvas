import Ajv2020 from "ajv/dist/2020"
import addFormats from "ajv-formats"

import studentCanvasSchema from "@/docs/SCHEMA/student-canvas.schema.json"
import type { StudentCanvasDocument } from "@/types/studentCanvasV1"

export type StudentCanvasValidationIssue = {
  path: string
  message: string
  keyword: string
}

export class StudentCanvasValidationError extends Error {
  public readonly issues: StudentCanvasValidationIssue[]

  constructor(message: string, issues: StudentCanvasValidationIssue[]) {
    super(message)
    this.name = "StudentCanvasValidationError"
    this.issues = issues
  }
}

const ajv = new Ajv2020({ allErrors: true })
addFormats(ajv)

const validateDocument = ajv.compile(studentCanvasSchema)

function toIssue(error: Record<string, unknown>): StudentCanvasValidationIssue {
  const instancePath = typeof error.instancePath === "string" ? error.instancePath : ""
  const dataPath = typeof error.dataPath === "string" ? error.dataPath : ""
  const schemaPath = instancePath.length > 0 ? instancePath : dataPath.length > 0 ? dataPath : "/"
  return {
    path: schemaPath,
    message: typeof error.message === "string" ? error.message : "Validation failed",
    keyword: typeof error.keyword === "string" ? error.keyword : "unknown",
  }
}

export function validateStudentCanvasDocument(document: unknown): {
  valid: boolean
  issues: StudentCanvasValidationIssue[]
} {
  const valid = validateDocument(document)
  if (valid) {
    return { valid: true, issues: [] }
  }

  return {
    valid: false,
    issues: (validateDocument.errors ?? []).map((error) =>
      toIssue(error as unknown as Record<string, unknown>)
    ),
  }
}

export function assertValidStudentCanvasDocument(
  document: unknown,
  context: string
): asserts document is StudentCanvasDocument {
  const result = validateStudentCanvasDocument(document)
  if (result.valid) {
    return
  }

  throw new StudentCanvasValidationError(
    `Student canvas schema validation failed (${context})`,
    result.issues
  )
}
