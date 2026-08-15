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
      return NextResponse.json(
        { error: "ID de notificación no proporcionado" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al marcar notificación:", error);
    return NextResponse.json(
      { error: "Error al actualizar la notificación" },
      { status: 500 }
    );
  }
}
