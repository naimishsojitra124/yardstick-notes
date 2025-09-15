import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { signToken } from '@/lib/auth'
import { applyCorsHeaders } from '@/lib/cors'

const COOKIE_NAME = 'token'
const TOKEN_TTL_SECONDS = 60 * 60 * 8 // 8 hours

export async function OPTIONS(req: NextRequest) {
  const res = NextResponse.json({}, { status: 204 })
  applyCorsHeaders(res, req)
  return res
}

export async function POST(req: NextRequest) {
  // Read body
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string }
  const { email, password } = body || {}

  // helper
  const makeError = (obj: any, status = 400) => {
    const r = NextResponse.json(obj, { status })
    applyCorsHeaders(r, req)
    return r
  }

  if (!email || !password) return makeError({ error: 'Missing email or password' }, 400)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return makeError({ error: 'Invalid credentials' }, 401)

  const ok = await bcrypt.compare(String(password), user.password)
  if (!ok) return makeError({ error: 'Invalid credentials' }, 401)

  const token = signToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email
  })

  const res = NextResponse.json({ success: true, token })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS
  })

  applyCorsHeaders(res, req)
  return res
}
