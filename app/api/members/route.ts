import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hash } from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  
  const members = await prisma.member.findMany({
    where: { clubId: session.clubId ?? undefined },
    include: { user: { select: { fullName: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  
  const body = await request.json();
  const { fullName, email, password, phone, memberCode, category } = body;
  
  if (!email || !password || !fullName || !memberCode) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });

  const passwordHash = await hash(password, 10);
  
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, phone, clubId: session.clubId, role: "MEMBER" }
  });

  const member = await prisma.member.create({
    data: {
      userId: user.id,
      clubId: session.clubId!,
      memberCode,
      category: category || "ADULTO",
      status: "ACTIVE",
    },
    include: { user: true }
  });

  return NextResponse.json(member, { status: 201 });
}
