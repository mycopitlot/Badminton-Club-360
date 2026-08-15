import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/session";
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email }, include: { member: true } });
    if (!user || !user.isActive) return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    const validPassword = await compare(password, user.passwordHash);
    if (!validPassword) return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    const token = await createSessionToken({ sub: user.id, email: user.email, role: user.role, clubId: user.clubId ?? undefined });
    const response = NextResponse.json({ success: true });
    response.cookies.set("session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) { return NextResponse.json({ error: "Error interno" }, { status: 500 }); }
}
