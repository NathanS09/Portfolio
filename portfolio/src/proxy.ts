import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/src/lib/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionToken(token);

  if (!valid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// /dashboard reste public (choix assumé du propriétaire) : seul /admin
// (création de contenu / gestion du leaderboard) requiert une session.
export const config = {
  matcher: ["/admin/:path*"],
};
