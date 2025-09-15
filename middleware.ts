import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// paths we want the middleware to run on (keep small & precise)
export const config = {
  matcher: ['/', '/login', '/notes/:path*']
}

// cookie name used by your login route
const COOKIE_NAME = 'token'

// helper to verify JWT using jose (HS256)
async function isTokenValid(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '')
    // jwtVerify will throw if invalid/expired
    await jwtVerify(token, secret)
    return true
  } catch (e) {
    // invalid or expired or secret missing
    return false
  }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = req.nextUrl.pathname

  // quick allowlist: don't interfere with API or static requests (we set matcher narrow but keep defensive)
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next()
  }

  // read token from cookie
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value

  // validate token (verifies signature and expiry)
  const valid = await isTokenValid(cookieToken)

  // If user hits root, redirect to login or notes depending on auth
  if (pathname === '/') {
    url.pathname = valid ? '/notes' : '/login'
    return NextResponse.redirect(url)
  }

  // If user is on login page but already has a valid token, send to notes
  if (pathname === '/login') {
    if (valid) {
      url.pathname = '/notes'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // If user tries to access protected pages (notes) without a valid token -> redirect to login
  if (pathname.startsWith('/notes')) {
    if (!valid) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // default: continue
  return NextResponse.next()
}
