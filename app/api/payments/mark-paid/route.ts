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
      return NextResponse.json({ error: "ID de pago no proporcionado" }, { status: 400 });
    }

    const clubId = session.clubId;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        ...(clubId ? { clubId } : {}),
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("Error al marcar pago como pagado:", error);
    return NextResponse.json({ error: "Error al actualizar el pago" }, { status: 500 });
  }
}
