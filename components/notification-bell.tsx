"use client";

import { useState, useEffect, useRef } from "react";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    }
  }

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    fetchNotifications();
  }

  async function markAllAsRead() {
    await fetch("/api/notifications/mark-all-read", {
      method: "POST",
    });

    fetchNotifications();
  }

  function formatRelativeTime(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return "Hace " + diffMins + " min";
    if (diffHours < 24) return "Hace " + diffHours + " h";
    if (diffDays < 7) return "Hace " + diffDays + " días";
    return date.toLocaleDateString("es-ES");
  }

  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-black hover:bg-slate-100 transition-colors"
        aria-label="Notificaciones"
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h3 className="text-sm font-bold text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                No hay notificaciones.
              </div>
            ) : (
              recentNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={
                    "border-b border-slate-800 px-4 py-3 last:border-b-0 " +
                    (notification.read ? "bg-slate-950" : "bg-slate-900/50")
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {notification.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {notification.body}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>

                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="shrink-0 rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Leer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
