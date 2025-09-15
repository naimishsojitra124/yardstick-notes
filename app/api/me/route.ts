import { NextResponse } from 'next/server'
import { getAuthFromReq } from '@/lib/auth'
import prisma from '@/lib/db'
import { applyCorsHeaders } from '@/lib/cors'

export async function GET(req: Request) {
  const res = NextResponse.json({}, { status: 401 })
  applyCorsHeaders(res)

  const payload = getAuthFromReq({ headers: req.headers } as any) //@typescript-eslint/no-explicit-any
  if (!payload) return res

  // find tenant details (like slug)
  const tenant = await prisma.tenant.findUnique({ where: { id: payload.tenantId } })
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const ok = NextResponse.json({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, plan: tenant.plan, noteLimit: tenant.noteLimit }
  })
  applyCorsHeaders(ok)
  return ok
}

export async function OPTIONS() {
  const r = NextResponse.json({})
  applyCorsHeaders(r)
  return r
}
