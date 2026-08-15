import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function roundRobin(players: string[]) {
  const list = [...players];

  if (list.length % 2 === 1) {
    list.push("BYE");
  }

  const n = list.length;
  const rounds: string[][][] = [];
  const half = n / 2;

  for (let r = 0; r < n - 1; r++) {
    const pairs: string[][] = [];

    for (let i = 0; i < half; i++) {
      pairs.push([list[i], list[n - 1 - i]]);
    }

    rounds.push(pairs);

    const last = list.pop()!;
    list.splice(1, 0, last);
  }

  return rounds;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const tournamentId = body?.tournamentId;
    const force = body?.force === true;

    if (!tournamentId) {
      return NextResponse.json({ error: "ID de torneo no proporcionado" }, { status: 400 });
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

    if (tournament.status === "CANCELLED" || tournament.status === "FINISHED") {
      return NextResponse.json({ error: "El torneo no admite generación de partidos" }, { status: 400 });
    }

    const existingCount = await prisma.match.count({
      where: {
        tournamentId,
      },
    });

    if (existingCount > 0 && !force) {
      return NextResponse.json(
        { error: "Ya existen partidos generados para este torneo." },
        { status: 409 }
      );
    }

    if (force) {
      await prisma.match.deleteMany({
        where: {
          tournamentId,
        },
      });
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        status: "PENDING",
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

    const byCategory: Record<string, string[]> = {};

    registrations.forEach((registration: any) => {
      const name =
        registration.member?.user?.fullName ||
        registration.member?.memberCode ||
        "Jugador";

      if (!byCategory[registration.category]) {
        byCategory[registration.category] = [];
      }

      byCategory[registration.category].push(name);
    });

    let created = 0;

    for (const [category, players] of Object.entries(byCategory)) {
      if (!Array.isArray(players) || players.length < 2) {
        continue;
      }

      const rounds = roundRobin(players);

      for (let i = 0; i < rounds.length; i++) {
        for (const pair of rounds[i]) {
          if (pair[0] === "BYE" || pair[1] === "BYE") {
            continue;
          }

          await prisma.match.create({
            data: {
              tournamentId,
              category,
              round: `Ronda ${String(i + 1).padStart(2, "0")}`,
              playerOne: pair[0],
              playerTwo: pair[1],
              status: "SCHEDULED",
            },
          });

          created++;
        }
      }
    }

    if (created === 0) {
      return NextResponse.json(
        { error: "No hay suficientes inscripciones activas para generar partidos." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, created });
  } catch (error) {
    console.error("Error al generar partidos:", error);
    return NextResponse.json({ error: "Error al generar partidos" }, { status: 500 });
  }
}
