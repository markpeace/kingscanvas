# Student Canvas v1 Decisions

Version stamp: `student-canvas.v1.0.0`  
Decision timestamp (UTC): `2026-04-22T00:00:00Z`

## Scope
This note records the short decision pass used to resolve contradictions in `NewSchema.docx` and lock the v1 storage contract in `docs/SCHEMA/student-canvas.schema.json`.

## Candidate Field/Rule Inventory Extracted from `NewSchema.docx`

### Root-level candidates
- `schema_version`
- `student_id`
- `created_at`
- `updated_at`
- `tutorial_state`
- `canvas`
- `events`
- `metrics`

### Canvas hierarchy candidates
- `canvas.intentions[]`
  - `id`, `title`, `description`, `bucket`, `decision_status`, `progress_status`, `created_at`, `updated_at`, `steps`
- `steps[]`
  - `id`, `title`, `description`, `bucket`, `order`, `decision_status`, `progress_status`, `created_at`, `updated_at`, `opportunities`
- `opportunities[]`
  - `id`, `title`, `description`, `decision_status`, `progress_status`, `source`, `catalogue_ref`, `created_at`, `updated_at`

### Candidate enum/value conventions seen in source material
- Bucket naming appeared in both title case (`Do now`) and slug/snake-like forms (`do-now`).
- Progress naming appeared in both title case (`In Progress`) and snake case (`in_progress`).
- Decision status appeared as `Accepted/Rejected/Suggested` and also lower snake-case style.

## Decision Pass Outcomes

| Topic | Decision | Rationale |
|---|---|---|
| Root metadata (`created_at`, `updated_at`) | **Required in v1** | We need deterministic record-level auditing and sync semantics at document root, independent of nested timestamps. |
| `events` and `metrics` | **Deferred (out of v1)** | They are useful for analytics/history, but not required for canonical student-plan persistence. Excluding them keeps v1 focused and reduces implementation risk. |
| Opportunity `source` and `catalogue_ref` | **Kept in v1** | Source provenance remains needed for mixed catalogue/free-text opportunities. `catalogue_ref` is conditionally required only when `source = catalogue`. |
| `decision_status` on intention/step | **Removed from intention/step in v1** | v1 stores confirmed plan content for intentions/steps; decision tracking remains only on opportunities where suggestion/acceptance is still meaningful. |
| Enum casing/naming | **snake_case for enum values and field names** | Ensures one consistent machine-first naming convention and avoids title-case/string-variant drift. |

## Final v1 JSON Example Payload

```json
{
  "schema_version": "1.0.0",
  "student_id": "k1234567",
  "created_at": "2026-04-22T00:00:00Z",
  "updated_at": "2026-04-22T00:00:00Z",
  "tutorial_state": {
    "persona_intro_seen": true,
    "first_opportunity_tip_seen": false
  },
  "canvas": {
    "intentions": [
      {
        "id": "11111111-1111-4111-8111-111111111111",
        "title": "Build professional network before graduation",
        "description": "Increase career readiness through targeted networking.",
        "bucket": "before_graduation",
        "progress_status": "in_progress",
        "created_at": "2026-04-22T00:00:00Z",
        "updated_at": "2026-04-22T00:00:00Z",
        "steps": [
          {
            "id": "22222222-2222-4222-8222-222222222222",
            "title": "Attend one careers fair",
            "description": "Attend and follow up with at least three employers.",
            "bucket": "do_now",
            "order": 0,
            "progress_status": "not_started",
            "created_at": "2026-04-22T00:00:00Z",
            "updated_at": "2026-04-22T00:00:00Z",
            "opportunities": [
              {
                "id": "33333333-3333-4333-8333-333333333333",
                "title": "King's Careers Fair 2026",
                "description": "Campus careers event for final-year students.",
                "decision_status": "accepted",
                "progress_status": "not_started",
                "source": "catalogue",
                "catalogue_ref": {
                  "system": "kings_edge_catalogue",
                  "id": "evt-2026-careers-fair"
                },
                "created_at": "2026-04-22T00:00:00Z",
                "updated_at": "2026-04-22T00:00:00Z"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## Contract File
- Canonical v1 storage contract: `docs/SCHEMA/student-canvas.schema.json`
