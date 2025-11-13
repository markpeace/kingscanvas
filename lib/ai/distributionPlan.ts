export type Bucket = "do_now" | "do_soon" | "before_grad" | "after_grad";

type PlanItem = { bucket: Bucket; count: number };

export function getDistributionForIntentionBucket(bucket: Bucket): PlanItem[] {
  switch (bucket) {
    case "after_grad":
      return [
        { bucket: "do_now", count: 3 },
        { bucket: "do_soon", count: 2 },
        { bucket: "before_grad", count: 1 }
      ];
    case "before_grad":
      return [
        { bucket: "do_now", count: 3 },
        { bucket: "do_soon", count: 2 }
      ];
    case "do_soon":
      return [
        { bucket: "do_now", count: 3 }
      ];
    case "do_now":
    default:
      return [
        { bucket: "do_now", count: 2 }
      ];
  }
}
