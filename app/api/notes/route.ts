import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { applyCorsHeaders } from "@/lib/cors";
import { requireAuthTenant } from "@/lib/requireAuthTenant";
import { MemberRole } from "@prisma/client";

export async function OPTIONS(req: NextRequest) {
  const res = NextResponse.json({}, { status: 204 })
  applyCorsHeaders(res, req)
  return res
}

export async function GET(req: Request) {
  const auth = await requireAuthTenant(req);
  if (auth instanceof NextResponse) return auth;
  const { tenant } = auth;

  const notes = await prisma.note.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const ok = NextResponse.json(notes);
  applyCorsHeaders(ok);
  return ok;
}

export async function POST(req: Request) {
  const auth = await requireAuthTenant(req);
  if (auth instanceof NextResponse) return auth;
  const { payload, tenant } = auth;

  // Only Admin or Member can create notes
  if (payload.role !== MemberRole.ADMIN && payload.role !== MemberRole.MEMBER) {
    const r = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    applyCorsHeaders(r);
    return r;
  }

  const body = await req.json().catch(() => ({}));
  const { title, content } = body || {};
  if (!title || typeof title !== "string") {
    const r = NextResponse.json({ error: "Title required" }, { status: 400 });
    applyCorsHeaders(r);
    return r;
  }

  // Enforce tenant note limit (null => unlimited)
  if (tenant.noteLimit !== null && tenant.noteLimit !== undefined) {
    const count = await prisma.note.count({ where: { tenantId: tenant.id } });
    if (count >= tenant.noteLimit) {
      const r = NextResponse.json(
        { error: "Note limit reached" },
        { status: 403 }
      );
      applyCorsHeaders(r);
      return r;
    }
  }

  const note = await prisma.note.create({
    data: {
      tenantId: tenant.id,
      title,
      content: content ?? "",
      createdBy: payload.userId,
    },
  });

  const ok = NextResponse.json(note, { status: 201 });
  applyCorsHeaders(ok);
  return ok;
}
