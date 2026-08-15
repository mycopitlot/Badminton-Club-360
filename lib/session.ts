import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-badminton-2026");
export type SessionPayload = { sub: string; email: string; role: string; clubId?: string; };
export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
}
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch { return null; }
}
