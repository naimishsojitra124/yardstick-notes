import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { getAuthFromReq } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { applyCorsHeaders } from '@/lib/cors'
import { v4 as uuidv4 } from 'uuid'
import { MemberRole } from '@prisma/client'

const BodySchema = z.object({
  email: z.string().email(),
  role: z.enum(['Admin', 'Member']).optional()
})

export async function OPTIONS(req: NextRequest) {
  const res = NextResponse.json({}, { status: 204 })
  applyCorsHeaders(res, req)
  return res
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const realParams = await params
  const slug = realParams.slug

  // auth
  const payload = getAuthFromReq({ headers: req.headers } as any) //@typescript-eslint/no-explicit-any
  const r401 = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  applyCorsHeaders(r401)
  if (!payload) return r401

  // only Admins can invite
  if (payload.role !== MemberRole.ADMIN && payload.role !== 'Admin' && payload.role !== 'ADMIN') {
    const r = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    applyCorsHeaders(r)
    return r
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) {
    const r = NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    applyCorsHeaders(r)
    return r
  }

  // Ensure admin invites only for their tenant
  if (tenant.id !== payload.tenantId) {
    const r = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    applyCorsHeaders(r)
    return r
  }

  const body = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)

  if (!parsed.success) {
    const r = NextResponse.json({ error: 'Invalid body', details: parsed.error }, { status: 400 })
    applyCorsHeaders(r)
    return r
  }

  const { email, role } = parsed.data

  // check if user already exists (global unique email)
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const r = NextResponse.json({ error: 'User already exists' }, { status: 409 })
    applyCorsHeaders(r)
    return r
  }

  // generate safe temporary password and create hash
  const tempPassword = `${uuidv4().split('-')[0]}A!`
  const hashed = await bcrypt.hash(tempPassword, 10)

  const roleToSave =
    role === 'Admin' ? MemberRole.ADMIN : MemberRole.MEMBER

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      password: hashed,
      role: roleToSave
    },
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
      createdAt: true
    }
  })

  const ok = NextResponse.json({ user, tempPassword }, { status: 201 })
  applyCorsHeaders(ok)
  return ok
}
