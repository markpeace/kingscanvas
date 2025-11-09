import Canvas from "@/components/Canvas/Canvas"
import { isProd } from "@/lib/auth/config"
import { getSession } from "@/lib/auth/server"
import { redirect } from "next/navigation"

export const metadata = { title: "Canvas • Lumin" }

export default async function HomePage() {
  if (!isProd) {
    return <Canvas />
  }

  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return <Canvas />
}
