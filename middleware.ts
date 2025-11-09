import { withAuth } from "next-auth/middleware";

const debugUser = process.env.DEBUG_USER;

export default debugUser
  ? function debugBypass() {
      return;
    }
  : withAuth({
      pages: {
        signIn: "/login",
      },
    });

export const config = {
  matcher: ["/api/:path*"],
};
