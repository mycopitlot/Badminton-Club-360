"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SociosPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchMembers() {
    const res = await fetch("/api/members");
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      fetchMembers();
      e.currentTarget.reset();
    } else {
      const err = await res.json();
      alert(err.error || "Error al crear socio");
    }
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Socios</h1>
          <p className="text-slate-400">
            Administra la base de datos de jugadores y miembros.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
        >
          {showForm ? "Cancelar" : "+ Nuevo Socio"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-lg"
        >
          <input
            name="fullName"
            placeholder="Nombre completo"
            required
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña inicial"
            required
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            name="phone"
            placeholder="Teléfono"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            name="memberCode"
            placeholder="Código (ej. SOC-002)"
            required
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select
            name="category"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ADULTO">Adulto</option>
            <option value="JUVENIL">Juvenil</option>
            <option value="INFANTIL">Infantil</option>
            <option value="FEDERADO">Federado</option>
          </select>
          <button
            type="submit"
            className="md:col-span-3 rounded-lg bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 shadow-sm"
          >
            Guardar Socio
          </button>
        </form>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  Cargando socios...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No hay socios registrados.
                </td>
              </tr>
            ) : (
              members.map((m: any) => {
                const statusClass =
                  m.status === "ACTIVE"
                    ? "bg-emerald-900/50 text-emerald-300"
                    : m.status === "SUSPENDED"
                      ? "bg-red-900/50 text-red-300"
                      : m.status === "INACTIVE"
                        ? "bg-slate-800 text-slate-300"
                        : "bg-amber-900/50 text-amber-300";

                return (
                  <tr key={m.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-blue-400">
                      {m.memberCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {m.user.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {m.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {m.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full " +
                          statusClass
                        }
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={"/dashboard/socios/" + m.id + "/carnet"}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Ver Carnet
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
