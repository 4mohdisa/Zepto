import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// TODO: TEMPORARY - Auth disabled for development. Re-enable when done.
export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|_static|_vercel|[^?]*\\..*).*)',
    '/api/(.*)'
  ]
};