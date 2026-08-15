import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { tournamentId, memberId, category, notes } = body;

    if (!tournamentId || !memberId || !category) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const tournament = await prisma.tournament.findFirst({
      where: {
        id: tournamentId,
        ...(session.clubId ? { clubId: session.clubId } : {}),
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
    }

    if (tournament.status === "FINISHED" || tournament.status === "CANCELLED") {
      return NextResponse.json({ error: "El torneo no admite inscripciones" }, { status: 400 });
    }

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        ...(session.clubId ? { clubId: session.clubId } : {}),
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
    }

    const registration = await prisma.tournamentRegistration.upsert({
      where: {
        tournamentId_memberId_category: {
          tournamentId,
          memberId,
          category,
        },
      },
      update: {
        status: "PENDING",
        notes: notes || null,
      },
      create: {
        tournamentId,
        memberId,
        category,
        status: "PENDING",
        notes: notes || null,
      },
      include: {
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

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error("Error al crear inscripción:", error);
    return NextResponse.json({ error: "Error al crear la inscripción" }, { status: 500 });
  }
}
