import type { NextRequestWithAuth } from "next-auth/middleware"
import { withAuth } from "next-auth/middleware"
import { NextFetchEvent, NextRequest, NextResponse } from "next/server"

import { isProd } from "@/lib/auth/config"

const prodMiddleware = withAuth({ pages: { signIn: "/login" } })

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!isProd) {
    return NextResponse.next()
  }

  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  return prodMiddleware(req as NextRequestWithAuth, event)
}
