import type { DefaultSession, NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google"

const debugUser =
  process.env.DEBUG_USER ||
  process.env.NEXT_PUBLIC_DEBUG_USER ||
  (process.env.NODE_ENV === "development" ? "Dev User" : null)

type ExtendedToken = JWT & {
  accessToken?: string
  user?: DefaultSession["user"]
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "debug-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "debug-client-secret"
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60
  },
  secret: process.env.NEXTAUTH_SECRET || "debug-secret",
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      const extendedToken = token as ExtendedToken

      if (account) {
        extendedToken.accessToken = account.access_token ?? extendedToken.accessToken
      }

      if (profile) {
        const { name, email, picture } = profile as GoogleProfile

        extendedToken.user = {
          name: name ?? extendedToken.user?.name ?? null,
          email: email ?? extendedToken.user?.email ?? null,
          image: picture ?? extendedToken.user?.image ?? null
        }
      }

      if (debugUser && !extendedToken.user) {
        const email = `${debugUser.toLowerCase().replace(/\s+/g, ".")}@debug.local`

        extendedToken.user = {
          name: debugUser,
          email,
          image: null
        }
      }

      return extendedToken
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedToken

      if (extendedToken.user) {
        session.user = extendedToken.user
      } else if (debugUser) {
        const email = `${debugUser.toLowerCase().replace(/\s+/g, ".")}@debug.local`

        session.user = {
          name: debugUser,
          email,
          image: null
        }
      }

      return session
    }
  }
}
