import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

const isProd =
  process.env.VERCEL_ENV === "production" ||
  (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === "production")

export default !isProd
  ? function middleware() {
      return NextResponse.next()
    }
  : withAuth({ pages: { signIn: "/login" } })

export const config = {
  matcher: isProd ? ["/api/:path*"] : []
}
