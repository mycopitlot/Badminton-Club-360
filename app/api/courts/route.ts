import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const courts = await prisma.court.findMany({
    where: { clubId: session.clubId ?? undefined },
    orderBy: { sortOrder: "asc" }
  });

  return NextResponse.json(courts);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, description, indoor, active } = body;

  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const existing = await prisma.court.findFirst({ where: { clubId: session.clubId ?? undefined, name } });
  if (existing) return NextResponse.json({ error: "Ya existe una pista con ese nombre" }, { status: 409 });

  const court = await prisma.court.create({
    data: {
      clubId: session.clubId!,
      name,
      description: description || null,
      indoor: indoor !== false,
      active: active !== false,
    }
  });

  return NextResponse.json(court, { status: 201 });
}
