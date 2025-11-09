import type { DefaultSession } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google"

export const isProd =
  process.env.VERCEL_ENV === "production" ||
  (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === "production")

type SessionUser = NonNullable<DefaultSession["user"]>

type ExtendedToken = JWT & { user?: SessionUser }

const testUser: SessionUser = {
  name: "Test User",
  email: "test@test.com",
  image: null
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, account, profile }) {
      const extendedToken = token as ExtendedToken

      if (isProd) {
        if (account && profile) {
          const profileData = profile as Record<string, unknown>

          extendedToken.user = {
            name: typeof profileData.name === "string" ? profileData.name : extendedToken.user?.name ?? null,
            email: typeof profileData.email === "string" ? profileData.email : extendedToken.user?.email ?? null,
            image: typeof profileData.picture === "string" ? profileData.picture : extendedToken.user?.image ?? null
          }
        }

        return extendedToken
      }

      extendedToken.user = extendedToken.user ?? testUser
      return extendedToken
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedToken

      if (isProd) {
        if (extendedToken.user) {
          session.user = extendedToken.user
        }

        return session
      }

      session.user = extendedToken.user ?? testUser
      return session
    }
  }
}
