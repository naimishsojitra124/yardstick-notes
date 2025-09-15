import { NextResponse } from "next/server";
import { getAuthFromReq, TokenPayload } from "@/lib/auth";
import prisma from "@/lib/db";
import { applyCorsHeaders } from "./cors";

type AuthTenant = {
  payload: TokenPayload;
  tenant: {
    id: string;
    slug: string;
    name: string;
    plan: string;
    noteLimit: number | null;
  };
};

export async function requireAuthTenant(
  req: Request,
  slugParam?: string
): Promise<AuthTenant | NextResponse> {
  const headers = req.headers as Headers;
  const payload = getAuthFromReq({ headers });
  const r401 = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  applyCorsHeaders(r401);
  if (!payload) return r401;

  // fetch tenant by id
  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
  });
  if (!tenant) {
    const r = NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    applyCorsHeaders(r);
    return r;
  }

  // If the route has a slug param, ensure it matches caller's tenant
  if (slugParam && tenant.slug !== slugParam) {
    const r = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    applyCorsHeaders(r);
    return r;
  }

  return { payload, tenant };
}
