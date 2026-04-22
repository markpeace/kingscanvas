import type { Opportunity } from "@/types/studentCanvasV1"

export function isOpportunitySchemaCompliant(opportunity: Partial<Opportunity>): boolean {
  if (opportunity.source === "catalogue" && !opportunity.catalogue_ref) {
    return false
  }

  if (opportunity.source === "free_text" && opportunity.catalogue_ref) {
    return false
  }

  if (opportunity.progress_status && opportunity.decision_status !== "accepted") {
    return false
  }

  return true
}
