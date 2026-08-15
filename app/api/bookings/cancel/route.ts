import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json(
        { error: "ID de reserva no proporcionado" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    if (session.clubId && booking.clubId !== session.clubId) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error al cancelar reserva:", error);

    return NextResponse.json(
      { error: "Error al cancelar la reserva" },
      { status: 500 }
    );
  }
}
