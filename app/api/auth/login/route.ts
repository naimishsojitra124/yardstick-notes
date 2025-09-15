// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { signToken } from '@/lib/auth'
import { applyCorsHeaders } from '@/lib/cors'

const COOKIE_NAME = 'token'
const TOKEN_TTL_SECONDS = 60 * 60 * 8 // 8 hours

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body || {}

  // @typescript-eslint/no-explicit-any
  const makeJson = (payload: any, status = 200) => {
    const res = NextResponse.json(payload, { status })
    applyCorsHeaders(res)
    return res
  }

  if (!email || !password) return makeJson({ error: 'Missing email or password' }, 400)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return makeJson({ error: 'Invalid credentials' }, 401)

  const ok = await bcrypt.compare(String(password), user.password)
  if (!ok) return makeJson({ error: 'Invalid credentials' }, 401)

  // Create JWT token
  const token = signToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email
  })

  // Build response and set HTTP-only cookie
  const res = NextResponse.json({ success: true })
  // Set cookie: HTTP only, secure in production, sameSite lax, path '/'
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS
  })

  applyCorsHeaders(res)
  return res
}

export async function OPTIONS() {
  const r = NextResponse.json({})
  applyCorsHeaders(r)
  return r
}