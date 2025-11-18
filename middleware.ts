import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

import { isProd } from "@/lib/auth/config"

export default async function middleware(req: NextRequest) {
  if (!isProd) {
    return NextResponse.next()
  }

  const { pathname } = req.nextUrl

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
  } catch (error) {
    console.error("Auth middleware: failed to verify token", error)
    return NextResponse.json({ error: "Authentication error" }, { status: 401 })
  }

  return NextResponse.next()
}
