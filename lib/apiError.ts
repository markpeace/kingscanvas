import type { NextApiResponse } from "next";

export function handleApiError(
  res: NextApiResponse,
  error: unknown,
  message = "Internal Server Error"
): void {
  console.error(message, error);
  if (!res.headersSent) {
    res.status(500).json({ error: message });
  }
}
