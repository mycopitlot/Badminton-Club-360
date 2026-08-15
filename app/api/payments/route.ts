import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const allowedTypes = [
  "MEMBERSHIP",
  "BOOKING",
  "TOURNAMENT",
  "DONATION",
  "OTHER",
];

const allowedStatus = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
];

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clubId = session.clubId;

    const payments = await prisma.payment.findMany({
      where: clubId ? { clubId } : undefined,
      include: {
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
        createdAt: "desc",
      },
      take: 300,
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    const {
      memberId,
      type,
      concept,
      amount,
      method,
      status,
    } = body;

    if (!memberId || !concept || !amount) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const amountNumber = Number(amount);

    if (isNaN(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { error: "El importe no es válido" },
        { status: 400 }
      );
    }

    const clubId = session.clubId;

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        ...(clubId ? { clubId } : {}),
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
    }

    const paymentType = allowedTypes.includes(type) ? type : "OTHER";
    const paymentStatus = allowedStatus.includes(status) ? status : "PENDING";

    const payment = await prisma.payment.create({
      data: {
        clubId: clubId || member.clubId,
        memberId,
        type: paymentType as any,
        amount: amountNumber,
        concept,
        method: method || null,
        status: paymentStatus as any,
        paidAt: paymentStatus === "PAID" ? new Date() : null,
      },
      include: {
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
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error al crear pago:", error);
    return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
  }
}
