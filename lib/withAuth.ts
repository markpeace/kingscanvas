import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/server";

type RouteContext = Record<string, unknown>;
type RouteHandler<T = Response> = (req: NextRequest, context: RouteContext) => Promise<T> | T;

export function withAuth<T = Response>(handler: RouteHandler<T>) {
  return async (req: NextRequest, context: RouteContext = {}) => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 }) as T;
    }

    return handler(req, context);
  };
}
