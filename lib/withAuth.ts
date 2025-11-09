import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/config";

type RouteContext = Record<string, unknown>;
type RouteHandler<T = Response> = (req: NextRequest, context: RouteContext) => Promise<T> | T;

export function withAuth<T = Response>(handler: RouteHandler<T>) {
  return async (req: NextRequest, context: RouteContext = {}) => {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 }) as T;
    }

    return handler(req, context);
  };
}
