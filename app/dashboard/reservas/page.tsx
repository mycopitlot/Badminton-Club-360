"use client";

import { useState, useEffect, useRef } from "react";

function getTodayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function generateSlots(startHour: number, endHour: number, intervalMinutes: number) {
  const slots: string[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      slots.push(String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0"));
    }
  }

  return slots;
}

export default function ReservasPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [courts, setCourts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<any>(null);
  const [form, setForm] = useState({ memberId: "", duration: "60", notes: "" });

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const activeCourts = courts.filter((court: any) => court.active);
  const slots = generateSlots(8, 22, 30);

  async function fetchInitialData() {
    setLoading(true);

    try {
      const [courtsRes, membersRes] = await Promise.all([
        fetch("/api/courts"),
        fetch("/api/members"),
      ]);

      const courtsData = await courtsRes.json();
      const membersData = await membersRes.json();

      setCourts(Array.isArray(courtsData) ? courtsData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookings() {
    try {
      const res = await fetch("/api/bookings?date=" + selectedDate);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando reservas:", error);
      setBookings([]);
    }
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  function changeDate(days: number) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    setSelectedDate(year + "-" + month + "-" + day);
  }

  function openDatePicker() {
    const el = dateInputRef.current;

    if (!el) return;

    el.focus();

    const anyEl = el as any;

    if (typeof anyEl.showPicker === "function") {
      try {
        anyEl.showPicker();
      } catch (error) {
        console.error("No se pudo abrir el calendario nativo:", error);
      }
    }
  }

  function slotStartDate(time: string) {
    return new Date(selectedDate + "T" + time + ":00");
  }

  function slotEndDate(time: string) {
    return new Date(slotStartDate(time).getTime() + 30 * 60000);
  }

  function getBookingAt(courtId: string, time: string) {
    const slotStart = slotStartDate(time);
    const slotEnd = slotEndDate(time);

    return bookings.find(
      (booking: any) =>
        booking.courtId === courtId &&
        booking.status !== "CANCELLED" &&
        new Date(booking.startsAt) < slotEnd &&
        new Date(booking.endsAt) > slotStart
    );
  }

  function openCreateModal(court: any, time: string) {
    if (members.length === 0) {
      alert("Primero debes crear al menos un socio.");
      return;
    }

    setForm({ memberId: members[0].id, duration: "60", notes: "" });
    setModal({ mode: "create", court, time });
  }

  function openDetailsModal(booking: any) {
    setModal({ mode: "details", booking });
  }

  function closeModal() {
    setModal(null);
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    if (!modal || modal.mode !== "create") return;

    if (!form.memberId) {
      alert("Selecciona un socio.");
      return;
    }

    setSaving(true);

    const startsAt = slotStartDate(modal.time);
    const endsAt = new Date(startsAt.getTime() + Number(form.duration) * 60000);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: form.memberId,
        courtId: modal.court.id,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        notes: form.notes,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      alert(data.error || "No se pudo crear la reserva.");
      return;
    }

    closeModal();
    fetchBookings();
  }

  async function handleCancelBooking(bookingId: string) {
    if (!confirm("¿Quieres cancelar esta reserva?")) return;

    const res = await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: bookingId,
      }),
    });

    if (!res.ok) {
      alert("No se pudo cancelar la reserva.");
      return;
    }

    closeModal();
    fetchBookings();
  }

  function formatTime(value: string) {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const previewEnd =
    modal?.mode === "create"
      ? new Date(
          slotStartDate(modal.time).getTime() + Number(form.duration) * 60000
        )
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Calendario de Reservas
          </h1>
          <p className="text-slate-400">
            Haz clic en un hueco libre para reservar. Haz clic en una reserva para ver detalles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => changeDate(-1)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
          >
            ←
          </button>

          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <button
            type="button"
            onClick={() => changeDate(1)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
          >
            →
          </button>

          <button
            type="button"
            onClick={openDatePicker}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Abrir calendario
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-300">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-emerald-500 bg-emerald-500/20"></span>
          Ocupado
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-dashed border-slate-600"></span>
          Libre
        </span>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400 shadow-lg">
          Cargando calendario...
        </div>
      ) : activeCourts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 p-8 text-center text-slate-400">
          No hay pistas activas. Crea pistas desde el módulo de Pistas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-24 border-b border-r border-slate-800 bg-slate-900 px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                  Hora
                </th>
                {activeCourts.map((court: any) => (
                  <th
                    key={court.id}
                    className="min-w-[11rem] border-b border-slate-800 bg-slate-900 px-4 py-3 text-left text-sm font-bold text-white"
                  >
                    {court.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot}>
                  <td className="sticky left-0 z-10 border-b border-r border-slate-800 bg-slate-900 px-4 py-2 font-mono text-xs text-slate-400">
                    {slot}
                  </td>

                  {activeCourts.map((court: any) => {
                    const booking = getBookingAt(court.id, slot);

                    return (
                      <td
                        key={court.id + "-" + slot}
                        className="border-b border-slate-800 p-1 align-top"
                      >
                        {booking ? (
                          <button
                            type="button"
                            onClick={() => openDetailsModal(booking)}
                            className="w-full rounded-lg border border-emerald-700 bg-emerald-900/30 px-2 py-2 text-left hover:bg-emerald-900/50 transition-colors"
                          >
                            <span className="block truncate text-xs font-semibold text-emerald-300">
                              {booking.member?.user?.fullName || "Socio"}
                            </span>
                            <span className="block text-[11px] text-emerald-400">
                              {formatTime(booking.startsAt)} - {formatTime(booking.endsAt)}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCreateModal(court, slot)}
                            className="w-full rounded-lg border border-dashed border-slate-700 px-2 py-2 text-xs text-slate-500 hover:border-blue-500 hover:bg-blue-950/30 hover:text-blue-400 transition-colors"
                          >
                            Libre
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.mode === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Nueva reserva</h2>
                <p className="text-sm text-slate-400">
                  {modal.court.name} - {selectedDate} - {modal.time}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-xl font-bold text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Socio
                </label>
                <select
                  value={form.memberId}
                  onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {members.map((member: any) => (
                    <option key={member.id} value={member.id}>
                      {member.memberCode} - {member.user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Duración
                </label>
                <select
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="90">90 minutos</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Notas
                </label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Entrenamiento, clase particular, torneo, etc."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {previewEnd && (
                <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                  Reserva: {modal.court.name}, de {modal.time} a{" "}
                  {formatTime(previewEnd.toISOString())}.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Confirmar reserva"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal?.mode === "details" && modal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Detalle de reserva</h2>
                <p className="text-sm text-slate-400">{modal.booking.court?.name}</p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-xl font-bold text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-sm text-slate-300">
              <p>
                <span className="font-semibold text-white">Socio:</span>{" "}
                {modal.booking.member?.user?.fullName || "-"}
              </p>
              <p>
                <span className="font-semibold text-white">Fecha:</span>{" "}
                {new Date(modal.booking.startsAt).toLocaleDateString()}
              </p>
              <p>
                <span className="font-semibold text-white">Horario:</span>{" "}
                {formatTime(modal.booking.startsAt)} - {formatTime(modal.booking.endsAt)}
              </p>
              <p>
                <span className="font-semibold text-white">Estado:</span> {modal.booking.status}
              </p>
              {modal.booking.notes && (
                <p>
                  <span className="font-semibold text-white">Notas:</span> {modal.booking.notes}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => handleCancelBooking(modal.booking.id)}
                className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950"
              >
                Cancelar reserva
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
