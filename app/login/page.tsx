import SignInButton from "@/components/auth/SignInButton"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui"

export const metadata = { title: "Login • NextJS PWA Template" }

export default function LoginPage() {
  return (
    <section className="py-8 sm:py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Use your Google account to continue.
          </p>
          <SignInButton />
        </CardContent>
      </Card>
    </section>
  )
}
