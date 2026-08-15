import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const where: any = {
    clubId: session.clubId ?? undefined,
  };

  if (date) {
    const startDate = new Date(`${date}T00:00:00`);
    const endDate = new Date(`${date}T23:59:59`);

    where.startsAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      court: true,
      member: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
  });

  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { courtId, memberId, startsAt, endsAt, notes } = body;

  if (!courtId || !memberId || !startsAt || !endsAt) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
  }

  if (endDate <= startDate) {
    return NextResponse.json({ error: "La hora de fin debe ser posterior a la de inicio" }, { status: 400 });
  }

  const court = await prisma.court.findFirst({
    where: {
      id: courtId,
      clubId: session.clubId ?? undefined,
      active: true,
    },
  });

  if (!court) {
    return NextResponse.json({ error: "La pista no está disponible" }, { status: 404 });
  }

  const member = await prisma.member.findFirst({
    where: {
      id: memberId,
      clubId: session.clubId ?? undefined,
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
  }

  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      clubId: session.clubId ?? undefined,
      courtId,
      status: {
        not: "CANCELLED",
      },
      startsAt: {
        lt: endDate,
      },
      endsAt: {
        gt: startDate,
      },
    },
  });

  if (overlappingBooking) {
    return NextResponse.json({ error: "La pista ya tiene una reserva en ese horario" }, { status: 409 });
  }

  const booking = await prisma.booking.create({
    data: {
      clubId: session.clubId!,
      courtId,
      memberId,
      startsAt: startDate,
      endsAt: endDate,
      status: "CONFIRMED",
      notes: notes || null,
      qrToken: crypto.randomUUID(),
    },
    include: {
      court: true,
      member: {
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
