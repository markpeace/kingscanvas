import NextAuth from "next-auth"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { authOptions } from "@/lib/auth/config"

const isProduction = process.env.VERCEL_ENV === "production"

const handler = NextAuth(authOptions)

if (!isProduction) {
  console.log("⚙️  Skipping authentication for preview/local build.")
}

const testUserResponse = {
  user: {
    name: "Test User",
    email: "test@test.com"
  }
} as const

export async function GET(
  request: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  if (!isProduction) {
    return NextResponse.json(testUserResponse)
  }

  return handler(request, context)
}

export async function POST(
  request: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  if (!isProduction) {
    return NextResponse.json(testUserResponse)
  }

  return handler(request, context)
}
