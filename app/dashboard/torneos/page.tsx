"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function TorneosPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchTournaments() {
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      setTournaments(data);
    } catch (error) {
      console.error("Error cargando torneos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      fetchTournaments();
      event.currentTarget.reset();
    } else {
      const errorData = await res.json();
      alert(errorData.error || "Error al crear torneo");
    }
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Torneos</h1>
          <p className="text-slate-400">
            Organiza competiciones, inscripciones, partidos y clasificaciones.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
        >
          {showForm ? "Cancelar" : "+ Nuevo Torneo"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-lg md:grid-cols-2"
        >
          <input
            name="name"
            placeholder="Nombre del torneo"
            required
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            name="location"
            placeholder="Ubicación"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Fecha de inicio
            </label>
            <input
              name="startsAt"
              type="date"
              required
              style={{ colorScheme: "dark" }}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Fecha de fin
            </label>
            <input
              name="endsAt"
              type="date"
              required
              style={{ colorScheme: "dark" }}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <input
            name="description"
            placeholder="Descripción del torneo"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2"
          />

          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 shadow-sm md:col-span-2"
          >
            Crear Torneo
          </button>
        </form>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {loading ? (
          <div className="col-span-2 py-8 text-center text-slate-400">
            Cargando torneos...
          </div>
        ) : tournaments.length === 0 ? (
          <div className="col-span-2 rounded-xl border-2 border-dashed border-slate-700 py-8 text-center text-slate-400">
            No hay torneos programados.
          </div>
        ) : (
          tournaments.map((tournament: any) => {
            const statusClass =
              tournament.status === "REGISTRATION_OPEN"
                ? "bg-blue-900/50 text-blue-300"
                : tournament.status === "FINISHED"
                  ? "bg-slate-800 text-slate-300"
                  : "bg-amber-900/50 text-amber-300";

            return (
              <div
                key={tournament.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-lg transition-shadow hover:shadow-blue-900/20 hover:border-slate-600"
              >
                <div className="mb-4 flex justify-between items-start">
                  <h3 className="text-lg font-bold text-white">{tournament.name}</h3>

                  <span className={"rounded-full px-2 py-1 text-xs font-semibold " + statusClass}>
                    {tournament.status === "REGISTRATION_OPEN"
                      ? "Inscripción Abierta"
                      : tournament.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <p>
                    <span className="font-medium text-slate-200">Ubicación:</span>{" "}
                    {tournament.location || "Por definir"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-200">Fechas:</span>{" "}
                    {new Date(tournament.startsAt).toLocaleDateString()} -{" "}
                    {new Date(tournament.endsAt).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium text-slate-200">Inscritos:</span>{" "}
                    {tournament._count?.registrations || 0}
                  </p>
                  <p>
                    <span className="font-medium text-slate-200">Partidos:</span>{" "}
                    {tournament._count?.matches || 0}
                  </p>
                </div>

                <Link
                  href={"/dashboard/torneos/detalle?id=" + tournament.id}
                  className="mt-4 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Gestionar torneo
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
