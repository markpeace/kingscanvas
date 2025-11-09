import Canvas from "@/components/Canvas/Canvas"
import { authOptions } from "@/lib/auth/config"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

const isProd =
  process.env.VERCEL_ENV === "production" ||
  (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === "production")

export const metadata = { title: "Canvas • Lumin" }

export default async function HomePage() {
  if (!isProd) {
    return <Canvas />
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <Canvas />
}
