import { z } from "zod"

// Input for creating a profile (server-validated)
export const ProfileInputSchema = z.object({
  displayName: z.string().min(1, "displayName is required").max(120),
  bio: z.string().max(1000).optional(),
})

// Stored document (includes _id string for convenience over ObjectId in responses)
export const ProfileSchema = ProfileInputSchema.extend({
  _id: z.string(),
  userId: z.string().min(1),           // NextAuth user id (sub/email); required on write
  createdAt: z.string(),               // ISO date
  updatedAt: z.string()                // ISO date
})

export type ProfileInput = z.infer<typeof ProfileInputSchema>
export type Profile = z.infer<typeof ProfileSchema>
