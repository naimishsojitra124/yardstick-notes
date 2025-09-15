import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "1234567890";

export type TokenPayload = {
  userId: string;
  tenantId: string;
  role: string;
  email?: string;
  iat?: number;
  exp?: number;
};

export function signToken(payload: Omit<TokenPayload, "iat" | "exp">) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const p = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return p;
  } catch (e) {
    console.log("ERROR: ", e);
    return null;
  }
}

export function getAuthFromReq(
  req: NextRequest | { headers: Headers | { [k: string]: string } }
) {
  const headersObj = (req as any).headers as Headers | Record<string, string>; //@typescript-eslint/no-explicit-any

  let authHeader = "";
  if (headersObj instanceof Headers) {
    authHeader =
      headersObj.get("authorization") || headersObj.get("Authorization") || "";
  } else {
    authHeader =
      headersObj["authorization"] || headersObj["Authorization"] || "";
  }

  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      const token = parts[1];
      return verifyToken(token);
    }
  }

  let cookieHeader = "";
  if (headersObj instanceof Headers) {
    cookieHeader = headersObj.get("cookie") || "";
  } else {
    cookieHeader = headersObj["cookie"] || headersObj["Cookie"] || "";
  }

  if (cookieHeader) {
    const pairs = cookieHeader.split(";").map((s) => s.trim());
    for (const p of pairs) {
      const [k, ...rest] = p.split("=");
      const key = k?.trim();
      const val = rest.join("=").trim();
      if (key === "token" && val) {
        try {
          const token = decodeURIComponent(val);
          return verifyToken(token);
        } catch {
          return verifyToken(val);
        }
      }
    }
  }

  return null;
}
