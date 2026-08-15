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
    const { id, name, description, sortOrder, indoor, active } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const clubId = session.clubId;

    const court = await prisma.court.findFirst({
      where: {
        id,
        ...(clubId ? { clubId } : {}),
      },
    });

    if (!court) {
      return NextResponse.json(
        { error: "Pista no encontrada" },
        { status: 404 }
      );
    }

    const updatedCourt = await prisma.court.update({
      where: { id },
      data: {
        name,
        description: description || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : Number(sortOrder) || 0,
        indoor: indoor !== undefined ? indoor : court.indoor,
        active: active !== undefined ? active : court.active,
      },
    });

    return NextResponse.json(updatedCourt);
  } catch (error) {
    console.error("Error al actualizar pista:", error);
    return NextResponse.json(
      { error: "Error al actualizar la pista" },
      { status: 500 }
    );
  }
}
