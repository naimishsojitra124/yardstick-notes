// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes (accessible without login)
const publicRoutes = ["/login"];

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

    console.log({token})

  const { pathname } = req.nextUrl;

  if(!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user is logged in and trying to access login/register → redirect to /notes
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/notes", req.url));
  }

  // If user is not logged in and trying to access protected routes → redirect to /login
  const isProtected =
    pathname.startsWith("/notes") || pathname.startsWith("/api/notes");
  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Define which paths should run through middleware
export const config = {
  matcher: ["/login", "/notes/:path*", "/api/notes/:path*"],
};
