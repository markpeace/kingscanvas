import type { NextApiRequest, NextApiResponse } from "next";
import { debug } from "../../../lib/debug";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  debug.info("Intentions API Ping", { time: new Date().toISOString() });
  res.status(200).json({ ok: true });
}
