import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

function formatDate(value: Date) {
  return value.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  if (status === "ACTIVE") return "Activo";
  if (status === "INACTIVE") return "Inactivo";
  if (status === "SUSPENDED") return "Suspendido";
  return "Pendiente";
}

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const memberId = resolvedParams.id;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      user: { select: { fullName: true } },
      club: { select: { name: true } },
      payments: {
        where: { status: "PAID" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!member) {
    notFound();
  }

  const lastPayment = member.payments.length > 0 ? member.payments[0] : null;

  const hasActivePayment =
    lastPayment !== null &&
    lastPayment.createdAt >= new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const initials = member.user.fullName
    .split(" ")
    .map((word: string) => word.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const statusColorClass =
    member.status === "ACTIVE"
      ? "bg-emerald-500"
      : member.status === "SUSPENDED"
        ? "bg-red-500"
        : member.status === "INACTIVE"
          ? "bg-slate-500"
          : "bg-amber-500";

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl ring-1 ring-slate-700">
          <div className="bg-blue-900/70 px-6 py-5 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
              B
            </div>
            <h1 className="text-lg font-bold text-white">
              {member.club?.name || "Club de Bádminton"}
            </h1>
            <p className="text-xs text-blue-300">Carnet Digital de Socio</p>
          </div>

          <div className="px-6 py-6">
            <div className="mb-6 flex flex-col items-center">
              <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-slate-700 text-2xl font-bold text-white">
                {initials}
              </div>
              <p className="text-center text-lg font-bold text-white">
                {member.user.fullName}
              </p>
              <p className="mt-1 font-mono text-sm text-blue-400">
                {member.memberCode}
              </p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                <p className="text-xs text-slate-400">Categoría</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {member.category || "General"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                <p className="text-xs text-slate-400">Estado</p>
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  <span className={"h-2 w-2 rounded-full " + statusColorClass}></span>
                  <span className="text-sm font-semibold text-white">
                    {statusLabel(member.status)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={
                "mb-4 rounded-lg p-3 text-center text-sm font-semibold " +
                (hasActivePayment
                  ? "bg-emerald-900/40 text-emerald-300"
                  : "bg-red-900/40 text-red-300")
              }
            >
              {hasActivePayment ? "✓ Cuota al día" : "✗ Cuota pendiente"}
            </div>

            <div className="flex justify-center rounded-xl bg-white p-4">
              <QRCodeSVG
                value={"/carnet/" + member.id}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          <div className="border-t border-slate-700 px-6 py-4 text-center">
            <p className="text-xs text-slate-400">
              Socio desde {formatDate(member.createdAt)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Presenta este carnet para acceder a las instalaciones
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Club de Bádminton 360 — Carnet digital válido como identificación de socio.
        </p>
      </div>
    </main>
  );
}