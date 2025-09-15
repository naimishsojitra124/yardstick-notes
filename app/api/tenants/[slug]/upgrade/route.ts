import { NextRequest, NextResponse } from "next/server";
import { requireAuthTenant } from "@/lib/requireAuthTenant";
import prisma from "@/lib/db";
import { applyCorsHeaders } from "@/lib/cors";
import { MemberRole, PlanType } from "@prisma/client";


export async function OPTIONS(req: NextRequest) {
  const res = NextResponse.json({}, { status: 204 })
  applyCorsHeaders(res, req)
  return res
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const realParams = await params;
  const slug = realParams.slug;
  const auth = await requireAuthTenant(req, slug);
  if (auth instanceof NextResponse) return auth;
  const { payload, tenant } = auth;

  // Only Admin allowed
  if (payload.role !== MemberRole.ADMIN) {
    const r = NextResponse.json(
      { error: "Only Admins can upgrade" },
      { status: 403 }
    );
    applyCorsHeaders(r);
    return r;
  }

  // Update tenant: plan -> pro, noteLimit -> null (unlimited)
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { plan: PlanType.PRO, noteLimit: null },
  });

  const ok = NextResponse.json({ success: true });
  applyCorsHeaders(ok);
  return ok;
}
