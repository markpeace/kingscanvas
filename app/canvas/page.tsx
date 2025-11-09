import Canvas from "@/components/Canvas/Canvas"
import { authOptions } from "@/lib/auth/config"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export const metadata = { title: "Canvas • Lumin" }

export default async function CanvasPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <Canvas />
}
