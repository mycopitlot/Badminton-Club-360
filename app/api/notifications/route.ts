import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clubId = session.clubId;

    const notifications = await prisma.notification.findMany({
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
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: messageBody, memberId } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "El título y el mensaje son obligatorios" },
        { status: 400 }
      );
    }

    const clubId = session.clubId;

    let targetMember = null;

    if (memberId) {
      targetMember = await prisma.member.findFirst({
        where: {
          id: memberId,
          ...(clubId ? { clubId } : {}),
        },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });

      if (!targetMember) {
        return NextResponse.json(
          { error: "Socio no encontrado" },
          { status: 404 }
        );
      }
    }

    const notification = await prisma.notification.create({
      data: {
        clubId: clubId || "",
        memberId: memberId || null,
        title,
        body: messageBody,
        read: false,
      },
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    if (targetMember) {
      const email = targetMember.user?.email;

      if (email) {
        const result = await sendEmail(email, title, messageBody);

        if (result.success) {
          emailsSent++;
        } else {
          emailsFailed++;
        }
      }
    } else {
      const activeMembers = await prisma.member.findMany({
        where: {
          status: "ACTIVE",
          ...(clubId ? { clubId } : {}),
        },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });

      for (const member of activeMembers) {
        const email = member.user?.email;

        if (email) {
          const result = await sendEmail(email, title, messageBody);

          if (result.success) {
            emailsSent++;
          } else {
            emailsFailed++;
          }
        }
      }
    }

    return NextResponse.json(
      {
        ...notification,
        emailsSent,
        emailsFailed,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear notificación:", error);
    return NextResponse.json(
      { error: "Error al crear la notificación" },
      { status: 500 }
    );
  }
}
