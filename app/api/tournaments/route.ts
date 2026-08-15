import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tournaments = await prisma.tournament.findMany({
    where: { clubId: session.clubId ?? undefined },
    orderBy: { startsAt: "desc" },
    include: {
      _count: { select: { registrations: true } }
    }
  });

  return NextResponse.json(tournaments);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, description, location, startsAt, endsAt, registrationDeadline } = body;

  if (!name || !startsAt || !endsAt) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const tournament = await prisma.tournament.create({
    data: {
      clubId: session.clubId!,
      name,
      slug,
      description: description || null,
      location: location || null,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      status: "REGISTRATION_OPEN",
    }
  });

  return NextResponse.json(tournament, { status: 201 });
}
