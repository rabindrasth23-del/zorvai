import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Paths that are always allowed even in waitlist mode
const WAITLIST_ALLOWED = [
  "/waitlist",
  "/api/waitlist",
  "/_next",
  "/logo.png",
  "/favicon.ico",
];

export async function proxy(request: NextRequest) {
  // ── Waitlist gating (fail-closed: blocks unless explicitly disabled) ──
  const waitlistMode = process.env.WAITLIST_MODE;
  const isWaitlistDisabled = waitlistMode === "false";

  if (!isWaitlistDisabled) {
    const path = request.nextUrl.pathname;
    const isAllowed = WAITLIST_ALLOWED.some((p) => path.startsWith(p)) ||
      path.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$/);

    if (!isAllowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/waitlist";
      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
