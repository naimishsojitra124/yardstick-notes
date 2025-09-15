import { NextResponse } from 'next/server'
import { requireAuthTenant } from '@/lib/requireAuthTenant'
import prisma from '@/lib/db'
import { applyCorsHeaders } from '@/lib/cors'
import { MemberRole, PlanType } from '@prisma/client'

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const auth = await requireAuthTenant(req, params.slug)
  if (auth instanceof NextResponse) return auth
  const { payload, tenant } = auth

  // Only Admin allowed
  if (payload.role !== MemberRole.ADMIN) {
    const r = NextResponse.json({ error: 'Only Admins can upgrade' }, { status: 403 })
    applyCorsHeaders(r)
    return r
  }

  // Update tenant: plan -> pro, noteLimit -> null (unlimited)
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { plan: PlanType.PRO, noteLimit: null }
  })

  const ok = NextResponse.json({ success: true })
  applyCorsHeaders(ok)
  return ok
}

export async function OPTIONS() {
  const r = NextResponse.json({})
  applyCorsHeaders(r)
  return r
}
