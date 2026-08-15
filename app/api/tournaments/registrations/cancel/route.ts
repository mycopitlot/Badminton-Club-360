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
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: "ID de inscripción no proporcionado" }, { status: 400 });
    }

    const registration = await prisma.tournamentRegistration.findFirst({
      where: {
        id,
        ...(session.clubId ? { tournament: { clubId: session.clubId } } : {}),
      },
    });

    if (!registration) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
    }

    const updatedRegistration = await prisma.tournamentRegistration.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json(updatedRegistration);
  } catch (error) {
    console.error("Error al cancelar inscripción:", error);
    return NextResponse.json({ error: "Error al cancelar la inscripción" }, { status: 500 });
  }
}
