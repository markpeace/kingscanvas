import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Attach basic Google info on first sign-in
      if (account?.provider === "google") {
        token.provider = "google"
      }
      return token
    },
    async session({ session, token }) {
      // Surface provider on client session if needed later
      (session as any).provider = token.provider
      return session
    }
  },
  // IMPORTANT: set NEXTAUTH_SECRET and NEXTAUTH_URL in env
  secret: process.env.NEXTAUTH_SECRET
}
