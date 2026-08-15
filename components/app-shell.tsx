"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { NotificationBell } from "@/components/notification-bell";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon:
      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    label: "Socios",
    href: "/dashboard/socios",
    icon:
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    label: "Pistas",
    href: "/dashboard/pistas",
    icon:
      "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    label: "Reservas",
    href: "/dashboard/reservas",
    icon:
      "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    label: "Torneos",
    href: "/dashboard/torneos",
    icon:
      "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
  {
    label: "Pagos",
    href: "/dashboard/pagos",
    icon:
      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "Comunicaciones",
    href: "/dashboard/comunicaciones",
    icon:
      "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  },
];

export function AppShell({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Menu lateral escritorio */}
      <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white font-bold">
            B
          </div>
          <div>
            <span className="block text-base font-bold text-black">
              Badminton 360
            </span>
            <span className="block text-xs font-bold text-slate-600">
              Panel de gestión
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-base font-bold text-black transition-colors last:mb-0 " +
                    (isActive ? "bg-slate-200" : "hover:bg-slate-100")
                  }
                >
                  <svg
                    className="h-5 w-5 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 truncate text-xs font-bold text-black">
              {userEmail}
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-black hover:bg-slate-100 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col bg-black">
        {/* Cabecera móvil */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menú"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-black"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <span className="text-base font-bold text-black">
              Badminton 360
            </span>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="text-sm font-bold text-black"
            >
              Salir
            </button>
          </div>
        </header>

        {/* Cabecera escritorio */}
        <header className="hidden h-14 items-center justify-between border-b border-slate-800 bg-black px-6 md:flex">
          <span className="text-sm text-slate-400">
            Club de Bádminton 360
          </span>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-slate-300">{userEmail}</span>
          </div>
        </header>

        {/* Menú móvil desplegable */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white p-3 md:hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={
                      "mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-base font-bold text-black transition-colors last:mb-0 " +
                      (isActive ? "bg-slate-200" : "hover:bg-slate-100")
                    }
                  >
                    <svg
                      className="h-5 w-5 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={item.icon}
                      />
                    </svg>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-5 lg:p-6 text-white">
          {children}
        </main>
      </div>
    </div>
  );
}
