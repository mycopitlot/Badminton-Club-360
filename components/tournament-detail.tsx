"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";

const categories = [
  { value: "INDIVIDUAL_MASCULINO", label: "Individual Masculino" },
  { value: "INDIVIDUAL_FEMENINO", label: "Individual Femenino" },
  { value: "DOBLES_MASCULINO", label: "Dobles Masculino" },
  { value: "DOBLES_FEMENINO", label: "Dobles Femenino" },
  { value: "DOBLES_MIXTO", label: "Dobles Mixto" },
];

function categoryLabel(value: string) {
  const found = categories.find((category) => category.value === value);
  return found ? found.label : value;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "FINISHED"
      ? "bg-emerald-900/50 text-emerald-300"
      : status === "CANCELLED"
        ? "bg-red-900/50 text-red-300"
        : status === "IN_PROGRESS"
          ? "bg-blue-900/50 text-blue-300"
          : "bg-amber-900/50 text-amber-300";

  return (
    <span className={"inline-flex rounded-full px-2 py-1 text-xs font-semibold " + styles}>
      {status}
    </span>
  );
}

function MatchRow({ match, onSaved }: { match: any; onSaved: () => void }) {
  const [score, setScore] = useState(match.score || "");
  const [winner, setWinner] = useState(match.winner || "");
  const [saving, setSaving] = useState(false);

  async function saveMatch() {
    if (!winner) {
      alert("Selecciona el ganador del partido.");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/tournaments/matches/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: match.id,
        score,
        winner,
        status: "FINISHED",
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      alert(data.error || "No se pudo guardar el partido.");
      return;
    }

    onSaved();
  }

  return (
    <tr className="hover:bg-slate-900/50 transition-colors">
      <td className="px-6 py-4 text-sm text-slate-300">
        {categoryLabel(match.category)}
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">{match.round}</td>
      <td className="px-6 py-4 text-sm font-medium text-white">
        {match.playerOne} <span className="text-slate-500">vs</span> {match.playerTwo}
      </td>
      <td className="px-6 py-4">
        <input
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="21-15, 21-18"
          className="w-36 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </td>
      <td className="px-6 py-4">
        <select
          value={winner}
          onChange={(e) => setWinner(e.target.value)}
          className="w-44 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Ganador</option>
          <option value={match.playerOne}>{match.playerOne}</option>
          <option value={match.playerTwo}>{match.playerTwo}</option>
        </select>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={match.status} />
          <button
            onClick={saveMatch}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function TournamentDetailClient({
  tournament,
  registrations,
  members,
  matches,
}: {
  tournament: any;
  registrations: any[];
  members: any[];
  matches: any[];
}) {
  const router = useRouter();

  const [tab, setTab] = useState<"inscripciones" | "partidos" | "clasificacion">("inscripciones");
  const [savingRegistration, setSavingRegistration] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [matchCategoryFilter, setMatchCategoryFilter] = useState("ALL");

  const [registrationForm, setRegistrationForm] = useState({
    memberId: members[0]?.id || "",
    category: categories[0].value,
    notes: "",
  });

  const activeRegistrations = registrations.filter((r) => r.status !== "CANCELLED");

  const matchCategories = Array.from(
    new Set(matches.map((match: any) => match.category))
  ) as string[];

  const filteredMatches =
    matchCategoryFilter === "ALL"
      ? matches
      : matches.filter((match: any) => match.category === matchCategoryFilter);

  const standings = useMemo(() => {
    const map: Record<string, any> = {};

    matches.forEach((match: any) => {
      if (match.status !== "FINISHED" || !match.winner) return;

      const players = [match.playerOne, match.playerTwo];

      players.forEach((player: string) => {
        if (!player || player === "BYE") return;

        const key = match.category + "|" + player;

        if (!map[key]) {
          map[key] = {
            category: match.category,
            player,
            played: 0,
            wins: 0,
            losses: 0,
          };
        }

        map[key].played += 1;

        if (match.winner === player) {
          map[key].wins += 1;
        } else {
          map[key].losses += 1;
        }
      });
    });

    return Object.values(map).sort(
      (a: any, b: any) =>
        b.wins - a.wins ||
        a.losses - b.losses ||
        a.player.localeCompare(b.player)
    );
  }, [matches]);

  function tabClass(active: boolean) {
    return (
      "rounded-lg px-4 py-2 text-sm font-semibold " +
      (active
        ? "bg-blue-600 text-white"
        : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800")
    );
  }

  async function addRegistration(event: React.FormEvent) {
    event.preventDefault();

    if (!registrationForm.memberId) {
      alert("Selecciona un socio.");
      return;
    }

    setSavingRegistration(true);

    const res = await fetch("/api/tournaments/registrations/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tournamentId: tournament.id,
        memberId: registrationForm.memberId,
        category: registrationForm.category,
        notes: registrationForm.notes,
      }),
    });

    const data = await res.json();
    setSavingRegistration(false);

    if (!res.ok) {
      alert(data.error || "No se pudo crear la inscripción.");
      return;
    }

    setRegistrationForm({
      ...registrationForm,
      notes: "",
    });

    router.refresh();
  }

  async function cancelRegistration(registrationId: string) {
    if (!confirm("¿Quieres cancelar esta inscripción?")) return;

    const res = await fetch("/api/tournaments/registrations/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: registrationId,
      }),
    });

    if (!res.ok) {
      alert("No se pudo cancelar la inscripción.");
      return;
    }

    router.refresh();
  }

  async function generateMatches(force = false) {
    setGenerating(true);

    const res = await fetch("/api/tournaments/matches/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tournamentId: tournament.id,
        force,
      }),
    });

    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      if (res.status === 409 && confirm(data.error + " ¿Quieres regenerarlos?")) {
        generateMatches(true);
        return;
      }

      alert(data.error || "No se pudieron generar los partidos.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href="/dashboard/torneos"
            className="text-sm font-medium text-blue-400 hover:underline"
          >
            ← Volver a torneos
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            {tournament.name}
          </h1>
          <p className="text-slate-400">
            Gestión de inscripciones, partidos y clasificación.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 shadow-sm">
          <p>
            <span className="font-semibold text-white">Fecha:</span>{" "}
            {formatDate(tournament.startsAt)} - {formatDate(tournament.endsAt)}
          </p>
          <p>
            <span className="font-semibold text-white">Ubicación:</span>{" "}
            {tournament.location || "Por definir"}
          </p>
          <p>
            <span className="font-semibold text-white">Estado:</span> {tournament.status}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Inscritos activos
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{activeRegistrations.length}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Partidos
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{matches.length}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Partidos finalizados
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {matches.filter((match: any) => match.status === "FINISHED").length}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab("inscripciones")} className={tabClass(tab === "inscripciones")}>
          Inscripciones
        </button>

        <button onClick={() => setTab("partidos")} className={tabClass(tab === "partidos")}>
          Partidos
        </button>

        <button onClick={() => setTab("clasificacion")} className={tabClass(tab === "clasificacion")}>
          Clasificación
        </button>
      </div>

      {tab === "inscripciones" && (
        <div className="space-y-6">
          <form
            onSubmit={addRegistration}
            className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm md:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Socio</label>
              <select
                value={registrationForm.memberId}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, memberId: e.target.value })
                }
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
              <label className="mb-1 block text-sm font-medium text-slate-300">Categoría</label>
              <select
                value={registrationForm.category}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, category: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Notas</label>
              <input
                value={registrationForm.notes}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, notes: e.target.value })
                }
                placeholder="Observaciones opcionales"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingRegistration}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 md:col-span-3"
            >
              {savingRegistration ? "Guardando..." : "Inscribir al torneo"}
            </button>
          </form>

          <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Socio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Fecha de inscripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No hay inscripciones para este torneo.
                    </td>
                  </tr>
                ) : (
                  registrations.map((registration: any) => {
                    const registrationStatusClass =
                      registration.status === "PENDING"
                        ? "bg-blue-900/50 text-blue-300"
                        : registration.status === "CANCELLED"
                          ? "bg-red-900/50 text-red-300"
                          : "bg-slate-800 text-slate-300";

                    return (
                      <tr key={registration.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {registration.member?.user?.fullName || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {categoryLabel(registration.category)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              "inline-flex rounded-full px-2 py-1 text-xs font-semibold " +
                              registrationStatusClass
                            }
                          >
                            {registration.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {formatDate(registration.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          {registration.status !== "CANCELLED" && (
                            <button
                              onClick={() => cancelRegistration(registration.id)}
                              className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-950"
                            >
                              Cancelar inscripción
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "partidos" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <button
                onClick={() => generateMatches(false)}
                disabled={generating}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? "Generando..." : "Generar partidos"}
              </button>

              <select
                value={matchCategoryFilter}
                onChange={(e) => setMatchCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">Todas las categorías</option>
                {matchCategories.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-slate-400">Total partidos: {filteredMatches.length}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Ronda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Partido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Marcador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Ganador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No hay partidos generados. Pulsa “Generar partidos”.
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map((match: any) => (
                    <MatchRow key={match.id} match={match} onSaved={() => router.refresh()} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "clasificacion" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Jugador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Jugados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Ganados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Perdidos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Aún no hay clasificación. Guarda resultados de partidos finalizados.
                  </td>
                </tr>
              ) : (
                standings.map((row: any, index: number) => (
                  <tr
                    key={row.category + "-" + row.player + "-" + index}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {categoryLabel(row.category)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">{row.player}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{row.played}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-400">{row.wins}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-400">{row.losses}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
