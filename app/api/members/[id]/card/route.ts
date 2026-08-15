import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const memberId = params.id;
    const clubId = session.clubId;

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        ...(clubId ? { clubId } : {}),
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        club: {
          select: {
            name: true,
            slug: true,
          },
        },
        payments: {
          where: {
            status: "PAID",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Socio no encontrado" },
        { status: 404 }
      );
    }

    const lastPayment = member.payments.length > 0 ? member.payments[0] : null;

    const hasActivePayment =
      lastPayment !== null &&
      lastPayment.createdAt >= new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      id: member.id,
      memberCode: member.memberCode,
      category: member.category,
      status: member.status,
      medicalCertificate: member.medicalCertificate,
      imageAuthorization: member.imageAuthorization,
      fullName: member.user.fullName,
      email: member.user.email,
      phone: member.user.phone,
      clubName: member.club?.name || "Club de Bádminton",
      clubSlug: member.club?.slug || "",
      createdAt: member.createdAt,
      lastPaymentDate: lastPayment ? lastPayment.createdAt : null,
      hasActivePayment,
      cardUrl: "/carnet/" + member.id,
    });
  } catch (error) {
    console.error("Error al obtener carnet:", error);
    return NextResponse.json(
      { error: "Error al obtener el carnet" },
      { status: 500 }
    );
  }
}