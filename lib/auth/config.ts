import type { DefaultSession, NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google"

type ExtendedToken = JWT & {
  accessToken?: string
  user?: DefaultSession["user"]
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60
  },
  secret: process.env.NEXTAUTH_SECRET,
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

      return extendedToken
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedToken

      if (extendedToken.user) {
        session.user = extendedToken.user
      }

      return session
    }
  }
}
