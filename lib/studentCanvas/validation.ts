import Ajv2020 from "ajv/dist/2020"
import addFormats from "ajv-formats"
import type { ErrorObject } from "ajv"

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

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)

const validateDocument = ajv.compile<StudentCanvasDocument>(studentCanvasSchema)

function toIssue(error: ErrorObject): StudentCanvasValidationIssue {
  const schemaPath = error.instancePath && error.instancePath.length > 0 ? error.instancePath : "/"
  return {
    path: schemaPath,
    message: error.message ?? "Validation failed",
    keyword: error.keyword,
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
    issues: (validateDocument.errors ?? []).map(toIssue),
  }
}

export function assertValidStudentCanvasDocument(document: unknown, context: string): asserts document is StudentCanvasDocument {
  const result = validateStudentCanvasDocument(document)
  if (result.valid) {
    return
  }

  throw new StudentCanvasValidationError(`Student canvas schema validation failed (${context})`, result.issues)
}
