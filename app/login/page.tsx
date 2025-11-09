import type { Metadata } from "next";

import LoginContent from "./LoginContent";

export const metadata: Metadata = {
  title: "King’s Canvas — Sign in"
};

export default function LoginPage() {
  return <LoginContent />;
}
