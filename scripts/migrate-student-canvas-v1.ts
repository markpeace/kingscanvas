import { getCollection } from "@/lib/dbHelpers"
import { debug } from "@/lib/debug"
import {
  assembleCanonicalDocument,
  readLegacySnapshot,
  STUDENT_CANVAS_MIGRATION_COLLECTION,
  STUDENT_CANVAS_PRIMARY_COLLECTION,
  STUDENT_CANVAS_SCHEMA_VERSION,
  writeMigrationMarker,
  type MigrationStats,
} from "@/lib/studentCanvas/migration"
import type { StudentCanvasDocument } from "@/types/studentCanvasV1"

const MIGRATION_FLAG = "STUDENT_CANVAS_ENABLE_MIGRATION_V1"

type AggregateCounters = {
  scanned: number
  migrated: number
  skipped_already_migrated: number
  empty_legacy: number
  failed: number
  rejects: number
}

function usage() {
  console.log("Usage: npx tsx scripts/migrate-student-canvas-v1.ts [--dry-run] [--limit=100] [--student=<id>]")
}

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run")
  const force = argv.includes("--force")
  const limitArg = argv.find((arg) => arg.startsWith("--limit="))
  const studentArg = argv.find((arg) => arg.startsWith("--student="))

  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined
  const studentId = studentArg ? studentArg.split("=")[1] : undefined

  if (limitArg && (!Number.isFinite(limit) || (limit ?? 0) <= 0)) {
    throw new Error("--limit must be a positive number")
  }

  return { dryRun, force, limit, studentId }
}

function mergeCounts(into: AggregateCounters, stats: MigrationStats) {
  into.rejects += stats.rejects.length
}

async function listCandidateStudentIds(limit?: number, specificStudentId?: string): Promise<string[]> {
  if (specificStudentId) {
    return [specificStudentId]
  }

  const intentions = await getCollection<{ user: string }>("intentions")
  const steps = await getCollection<{ user: string }>("steps")
  const opportunities = await getCollection<{ user: string }>("opportunities")

  const [intentionUsers, stepUsers, opportunityUsers] = await Promise.all([
    intentions.distinct("user"),
    steps.distinct("user"),
    opportunities.distinct("user"),
  ])

  const unique = Array.from(new Set([...intentionUsers, ...stepUsers, ...opportunityUsers])).filter(Boolean)
  return typeof limit === "number" ? unique.slice(0, limit) : unique
}

async function run() {
  const args = parseArgs(process.argv.slice(2))

  if (process.argv.includes("--help")) {
    usage()
    return
  }

  if (process.env[MIGRATION_FLAG] !== "true" && !args.force) {
    console.error(`Migration blocked. Set ${MIGRATION_FLAG}=true or pass --force.`)
    process.exitCode = 1
    return
  }

  const counters: AggregateCounters = {
    scanned: 0,
    migrated: 0,
    skipped_already_migrated: 0,
    empty_legacy: 0,
    failed: 0,
    rejects: 0,
  }

  const targetStudents = await listCandidateStudentIds(args.limit, args.studentId)
  const primaryCollection = await getCollection<StudentCanvasDocument>(STUDENT_CANVAS_PRIMARY_COLLECTION)

  for (const studentId of targetStudents) {
    counters.scanned += 1

    try {
      const existing = await primaryCollection.findOne({ student_id: studentId })
      if (existing?.schema_version === STUDENT_CANVAS_SCHEMA_VERSION) {
        counters.skipped_already_migrated += 1
        continue
      }

      const snapshot = await readLegacySnapshot(studentId)
      const { document, stats } = assembleCanonicalDocument(studentId, snapshot)
      mergeCounts(counters, stats)

      if (!document) {
        counters.empty_legacy += 1
        continue
      }

      if (!args.dryRun) {
        await primaryCollection.updateOne(
          { student_id: studentId },
          {
            $set: {
              ...document,
              schema_version: STUDENT_CANVAS_SCHEMA_VERSION,
            },
            $setOnInsert: {
              created_at: document.created_at,
            },
          },
          { upsert: true },
        )
      }

      if (!args.dryRun) {
        await writeMigrationMarker({
          student_id: studentId,
          schema_version: STUDENT_CANVAS_SCHEMA_VERSION,
          status: "migrated",
          migrated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          counts: {
            intentions_total: stats.intentions_total,
            intentions_migrated: stats.intentions_migrated,
            steps_total: stats.steps_total,
            steps_migrated: stats.steps_migrated,
            opportunities_total: stats.opportunities_total,
            opportunities_migrated: stats.opportunities_migrated,
          },
          reject_count: stats.rejects.length,
          rejects: stats.rejects,
        })
      }

      counters.migrated += 1
      debug.info("StudentCanvas migration: record processed", {
        studentId,
        dryRun: args.dryRun,
        migrated: true,
        rejects: stats.rejects,
      })
    } catch (error) {
      counters.failed += 1
      const message = error instanceof Error ? error.message : "Unknown migration error"

      await writeMigrationMarker({
        student_id: studentId,
        schema_version: STUDENT_CANVAS_SCHEMA_VERSION,
        status: "failed",
        updated_at: new Date().toISOString(),
        counts: {
          intentions_total: 0,
          intentions_migrated: 0,
          steps_total: 0,
          steps_migrated: 0,
          opportunities_total: 0,
          opportunities_migrated: 0,
        },
        reject_count: 0,
        rejects: [],
        error: message,
      })

      debug.error("StudentCanvas migration: record failed", {
        studentId,
        error: message,
      })
    }
  }

  const markers = await getCollection(STUDENT_CANVAS_MIGRATION_COLLECTION)
  const failedReasons = await markers
    .find({ schema_version: STUDENT_CANVAS_SCHEMA_VERSION, status: "failed" })
    .project({ student_id: 1, error: 1, _id: 0 })
    .limit(20)
    .toArray()

  console.log("StudentCanvas migration summary", {
    ...counters,
    failed_reasons: failedReasons,
    dryRun: args.dryRun,
    schema_version: STUDENT_CANVAS_SCHEMA_VERSION,
  })
}

run().catch((error) => {
  console.error("Migration fatal error", error)
  process.exitCode = 1
})
