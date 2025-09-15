import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { applyCorsHeaders } from "@/lib/cors";
import { requireAuthTenant } from "@/lib/requireAuthTenant";
import { MemberRole } from "@prisma/client";

export async function OPTIONS() {
  const r = NextResponse.json({});
  applyCorsHeaders(r);
  return r;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const realParams = await params;
  const id = realParams.id;

  const auth = await requireAuthTenant(req);
  if (auth instanceof NextResponse) return auth;
  const { tenant } = auth;

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.tenantId !== tenant.id) {
    const r = NextResponse.json({ error: "Not found" }, { status: 404 });
    applyCorsHeaders(r);
    return r;
  }

  const ok = NextResponse.json(note);
  applyCorsHeaders(ok);
  return ok;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const realParams = await params;
  const id = realParams.id;

  const auth = await requireAuthTenant(req);
  if (auth instanceof NextResponse) return auth;
  const { payload, tenant } = auth;

  // Only Admin or Member allowed
  if (payload.role !== MemberRole.ADMIN && payload.role !== MemberRole.MEMBER) {
    const r = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    applyCorsHeaders(r);
    return r;
  }

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.tenantId !== tenant.id) {
    const r = NextResponse.json({ error: "Not found" }, { status: 404 });
    applyCorsHeaders(r);
    return r;
  }

  const body = await req.json().catch(() => ({}));
  const { title, content } = body || {};

  const updated = await prisma.note.update({
    where: { id },
    data: {
      title: typeof title === "string" ? title : note.title,
      content: typeof content === "string" ? content : note.content,
    },
  });

  const ok = NextResponse.json(updated);
  applyCorsHeaders(ok);
  return ok;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const realParams = await params;
  const id = realParams.id;

  const auth = await requireAuthTenant(req);
  if (auth instanceof NextResponse) return auth;
  const { payload, tenant } = auth;

  // Only Admin or Member allowed
  if (payload.role !== MemberRole.ADMIN && payload.role !== MemberRole.MEMBER) {
    const r = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    applyCorsHeaders(r);
    return r;
  }

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.tenantId !== tenant.id) {
    const r = NextResponse.json({ error: "Not found" }, { status: 404 });
    applyCorsHeaders(r);
    return r;
  }

  await prisma.note.delete({ where: { id } });

  const ok = new NextResponse(null, { status: 204 });
  applyCorsHeaders(ok);
  return ok;
}
