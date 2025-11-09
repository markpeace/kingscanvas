import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "google") {
        token.provider = "google"
      }
      return token
    },
    async session({ session, token }) {
      ;(session as any).provider = token.provider
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}
