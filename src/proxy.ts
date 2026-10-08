import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/core/session";

export async function proxy(request: NextRequest) {
  const ok = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!ok) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
