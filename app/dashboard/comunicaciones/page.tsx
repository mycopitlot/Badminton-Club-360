"use client";

import { useState, useEffect } from "react";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ComunicacionesPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    title: "",
    body: "",
    memberId: "",
  });

  async function fetchData() {
    setLoading(true);

    try {
      const [notifRes, membersRes] = await Promise.all([
        fetch("/api/notifications"),
        fetch("/api/members"),
      ]);

      const notifData = await notifRes.json();
      const membersData = await membersRes.json();

      setNotifications(Array.isArray(notifData) ? notifData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function sendNotification(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title || !form.body) {
      alert("El título y el mensaje son obligatorios.");
      return;
    }

    setSending(true);

    const payload: any = {
      title: form.title,
      body: form.body,
    };

    if (form.memberId) {
      payload.memberId = form.memberId;
    }

    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      alert(data.error || "No se pudo enviar la comunicación.");
      return;
    }

    setForm({ title: "", body: "", memberId: "" });
    fetchData();
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Comunicaciones
        </h1>
        <p className="text-slate-400">
          Envía avisos y notificaciones a los socios del club.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Total comunicaciones
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Sin leer
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-400">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Leídas
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {notifications.length - unreadCount}
          </p>
        </div>
      </div>

      <form
        onSubmit={sendNotification}
        className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-lg"
      >
        <h2 className="mb-4 text-lg font-bold text-white">
          Nueva comunicación
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Título
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Convocatoria de torneo, cambio de horario, aviso importante..."
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Mensaje
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Escribe el contenido de la comunicación..."
              rows={4}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Destinatario
            </label>
            <select
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos los socios</option>
              {members.map((member: any) => (
                <option key={member.id} value={member.id}>
                  {member.memberCode} - {member.user.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 md:w-auto"
        >
          {sending ? "Enviando..." : "Enviar comunicación"}
        </button>
      </form>

      <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-900 px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            Historial de comunicaciones
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-slate-400">
            Cargando comunicaciones...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400">
            No hay comunicaciones enviadas.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={
                  "px-6 py-4 transition-colors " +
                  (notification.read ? "bg-slate-950" : "bg-slate-900/50")
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      )}
                      <h3 className="text-sm font-semibold text-white">
                        {notification.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                      {notification.body}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>
                        {formatDate(notification.createdAt)}{" "}
                        {formatTime(notification.createdAt)}
                      </span>
                      <span>
                        Destinatario:{" "}
                        {notification.member
                          ? notification.member.user.fullName
                          : "Todos los socios"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={
                      "inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-semibold " +
                      (notification.read
                        ? "bg-slate-800 text-slate-300"
                        : "bg-blue-900/50 text-blue-300")
                    }
                  >
                    {notification.read ? "Leída" : "Sin leer"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
