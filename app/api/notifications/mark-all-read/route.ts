import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clubId = session.clubId;

    await prisma.notification.updateMany({
      where: {
        ...(clubId ? { clubId } : {}),
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al marcar todas como leídas:", error);
    return NextResponse.json(
      { error: "Error al actualizar notificaciones" },
      { status: 500 }
    );
  }
}
