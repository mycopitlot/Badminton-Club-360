import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";

function Racket({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 100 118" className={className}>
      <ellipse cx="50" cy="30" rx="20" ry="25" fill="none" stroke="currentColor" strokeWidth="6" />
      <line x1="36" y1="18" x2="64" y2="42" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="36" y1="42" x2="64" y2="18" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="50" y1="6" x2="50" y2="54" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="31" y1="30" x2="69" y2="30" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="46.5" y="54" width="7" height="8" rx="2" fill="currentColor" />
      <rect x="47" y="61" width="6" height="52" rx="3" fill="#000000" />
    </svg>
  );
}

function CourtIllustration() {
  return (
    <div className="relative mx-auto w-full">
      <svg
        viewBox="0 0 680 310"
        className="w-full drop-shadow-2xl"
        role="img"
        aria-label="Cancha de badminton azul con red, raquetas cruzadas y volante"
      >
        {/* Sombra exterior */}
        <rect x="24" y="22" width="632" height="272" rx="14" fill="#000000" opacity="0.35" />

        {/* Borde exterior azul oscuro */}
        <rect x="20" y="16" width="640" height="278" rx="12" fill="#1e3a8a" />

        {/* Superficie de juego azul */}
        <rect x="34" y="30" width="612" height="250" rx="8" fill="#2563eb" />

        {/* Lineas exteriores blancas */}
        <rect
          x="34" y="30" width="612" height="250" rx="8"
          fill="none" stroke="#ffffff" strokeWidth="3"
        />

        {/* Linea central vertical (red) */}
        <line x1="340" y1="30" x2="340" y2="280" stroke="#ffffff" strokeWidth="2.5" />

        {/* Lineas de servicio cortas (verticales, a 1.98m de la red) */}
        <line x1="240" y1="30" x2="240" y2="280" stroke="#ffffff" strokeWidth="2" />
        <line x1="440" y1="30" x2="440" y2="280" stroke="#ffffff" strokeWidth="2" />

        {/* Linea central horizontal (divide campos de servicio) */}
        <line x1="34" y1="155" x2="240" y2="155" stroke="#ffffff" strokeWidth="2" />
        <line x1="440" y1="155" x2="646" y2="155" stroke="#ffffff" strokeWidth="2" />

        {/* Lineas de servicio dobles (horizontales, paralelas a la red) */}
        <line x1="34" y1="58" x2="646" y2="58" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
        <line x1="34" y1="252" x2="646" y2="252" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />

        {/* Lineas de fondo (ya son el borde exterior) */}
        {/* Lineas laterales dobles (ya son el borde exterior) */}

        {/* Red: postes superior e inferior */}
        <rect x="334" y="12" width="12" height="10" rx="3" fill="#0f172a" />
        <rect x="334" y="288" width="12" height="10" rx="3" fill="#0f172a" />

        {/* Red: fondo semitransparente vertical */}
        <rect x="336" y="22" width="8" height="266" fill="#0f172a" opacity="0.25" />

        {/* Red: malla vertical */}
        {[30, 42, 54, 66, 78, 90, 102, 114, 126, 138, 150, 162, 174, 186, 198, 210, 222, 234, 246, 258, 270, 282].map((y) => (
          <line key={y} x1="336" y1={y} x2="344" y2={y} stroke="#f8fafc" strokeWidth="1" opacity="0.8" />
        ))}

        {/* Red: bandas */}
        <rect x="336" y="22" width="8" height="3" fill="#f8fafc" />
        <rect x="336" y="285" width="8" height="3" fill="#f8fafc" />
      </svg>

      {/* Raquetas cruzadas y volante superpuestos */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-32 w-32 md:h-40 md:w-40">
          <Racket className="absolute inset-0 h-full w-full -rotate-45 text-slate-200 drop-shadow-md" />
          <Racket className="absolute inset-0 h-full w-full rotate-45 text-slate-400 drop-shadow-md" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[88%]">
            <svg viewBox="0 0 40 40" className="h-10 w-10 drop-shadow-md md:h-12 md:w-12">
              <polygon points="14,18 26,18 33,4 7,4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
              <line x1="17" y1="18" x2="13" y2="4" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="20" y1="18" x2="20" y2="4" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="23" y1="18" x2="27" y2="4" stroke="#cbd5e1" strokeWidth="1" />
              <circle cx="20" cy="25" r="7" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  const clubId = session?.clubId;
  const where = clubId ? { clubId } : {};

  const [membersCount, courtsCount, upcomingBookings] = await Promise.all([
    prisma.member.count({ where }),
    prisma.court.count({ where }),
    prisma.booking.count({ where: { ...where, startsAt: { gte: new Date() }, status: { not: "CANCELLED" } } }),
  ]);

  const cards = [
    { label: "Socios", value: membersCount, href: "/dashboard/socios", accent: "border-t-blue-500", description: "Total de socios registrados" },
    { label: "Pistas", value: courtsCount, href: "/dashboard/pistas", accent: "border-t-emerald-500", description: "Total de pistas activas" },
    { label: "Próximas Reservas", value: upcomingBookings, href: "/dashboard/reservas", accent: "border-t-violet-500", description: "Reservas futuras sin cancelar" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Club de Bádminton 360</h1>
        <p className="mt-2 text-base text-slate-300">
          Bienvenido de nuevo, <span className="font-semibold text-white">{session?.email}</span>.
        </p>
        <p className="text-sm text-slate-400">Centro de gestión integral de tu club de bádminton.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl md:p-6">
        <CourtIllustration />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className={"group rounded-xl border border-slate-800 border-t-4 bg-slate-900 p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-blue-900/20 hover:border-slate-600 " + card.accent}>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
            <p className="mt-2 text-4xl font-bold text-white">{card.value}</p>
            <p className="mt-2 text-sm text-slate-400">{card.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
              Ver módulo
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </span>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-center text-sm text-slate-400 shadow-lg">
        Badminton Club 360 — Gestión de socios, pistas, reservas y torneos desde una única plataforma.
      </div>
    </div>
  );
}
