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
    const { id, score, winner, status } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de partido no proporcionado" }, { status: 400 });
    }

    const match = await prisma.match.findFirst({
      where: {
        id,
        ...(session.clubId ? { tournament: { clubId: session.clubId } } : {}),
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    const nextStatus = status || (winner ? "FINISHED" : "SCHEDULED");

    if (nextStatus === "FINISHED") {
      if (!winner) {
        return NextResponse.json({ error: "Debes seleccionar un ganador" }, { status: 400 });
      }

      if (winner !== match.playerOne && winner !== match.playerTwo) {
        return NextResponse.json({ error: "El ganador no es válido" }, { status: 400 });
      }
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        score: score ?? null,
        winner: winner ?? null,
        status: nextStatus,
      },
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error("Error al guardar partido:", error);
    return NextResponse.json({ error: "Error al guardar el partido" }, { status: 500 });
  }
}
