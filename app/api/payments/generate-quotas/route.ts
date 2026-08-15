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

    const { month, amount, concept } = body;

    if (!month || !amount) {
      return NextResponse.json(
        { error: "Debes indicar mes e importe" },
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

    const members = await prisma.member.findMany({
      where: {
        ...(clubId ? { clubId } : {}),
        status: "ACTIVE",
      },
    });

    const defaultConcept = concept || "Cuota " + month;

    let created = 0;
    let skipped = 0;

    for (const member of members) {
      const existing = await prisma.payment.findFirst({
        where: {
          memberId: member.id,
          type: "MEMBERSHIP",
          concept: defaultConcept,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.payment.create({
        data: {
          clubId: clubId || member.clubId,
          memberId: member.id,
          type: "MEMBERSHIP" as any,
          amount: amountNumber,
          concept: defaultConcept,
          status: "PENDING" as any,
          method: null,
        },
      });

      created++;
    }

    return NextResponse.json({
      created,
      skipped,
      total: members.length,
    });
  } catch (error) {
    console.error("Error al generar cuotas:", error);
    return NextResponse.json({ error: "Error al generar cuotas" }, { status: 500 });
  }
}
