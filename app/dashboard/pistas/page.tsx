"use client";

import { useState, useEffect } from "react";

export default function PistasPage() {
  const [courts, setCourts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingCourt, setEditingCourt] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    sortOrder: "0",
    indoor: true,
    active: true,
  });

  async function fetchCourts() {
    const res = await fetch("/api/courts");
    const data = await res.json();
    setCourts(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchCourts();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      sortOrder: Number(formData.get("sortOrder")) || 0,
      indoor: formData.get("indoor") === "on",
      active: formData.get("active") === "on",
    };

    const res = await fetch("/api/courts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      fetchCourts();
      e.currentTarget.reset();
    } else {
      const err = await res.json();
      alert(err.error || "Error al crear pista");
    }
  }

  function openEdit(court: any) {
    setEditingCourt(court);
    setEditForm({
      name: court.name,
      description: court.description || "",
      sortOrder: String(court.sortOrder),
      indoor: court.indoor,
      active: court.active,
    });
  }

  function closeEdit() {
    setEditingCourt(null);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    setSavingEdit(true);

    const res = await fetch("/api/courts/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingCourt.id,
        name: editForm.name,
        description: editForm.description,
        sortOrder: Number(editForm.sortOrder),
        indoor: editForm.indoor,
        active: editForm.active,
      }),
    });

    const data = await res.json();
    setSavingEdit(false);

    if (!res.ok) {
      alert(data.error || "Error al actualizar pista");
      return;
    }

    closeEdit();
    fetchCourts();
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Pistas</h1>
          <p className="text-slate-400">Administra las instalaciones del club.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
        >
          {showForm ? "Cancelar" : "+ Nueva Pista"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-lg"
        >
          <input
            name="name"
            placeholder="Nombre de la pista"
            required
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            name="description"
            placeholder="Descripción opcional"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Orden (posición en la lista)
            </label>
            <input
              name="sortOrder"
              type="number"
              min="0"
              placeholder="4"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="indoor"
                defaultChecked
                id="indoor"
                className="h-4 w-4 rounded border-slate-600 bg-slate-800"
              />
              <label htmlFor="indoor" className="text-sm text-slate-300">
                Interior
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked
                id="active"
                className="h-4 w-4 rounded border-slate-600 bg-slate-800"
              />
              <label htmlFor="active" className="text-sm text-slate-300">
                Activa
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="md:col-span-2 rounded-lg bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 shadow-sm"
          >
            Guardar Pista
          </button>
        </form>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Orden
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Tipo
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
                  Cargando pistas...
                </td>
              </tr>
            ) : courts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No hay pistas registradas.
                </td>
              </tr>
            ) : (
              [...courts]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-blue-400">
                      {c.sortOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {c.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {c.indoor ? "Interior" : "Exterior"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full " +
                          (c.active
                            ? "bg-emerald-900/50 text-emerald-300"
                            : "bg-red-900/50 text-red-300")
                        }
                      >
                        {c.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {editingCourt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Editar pista</h2>
                <p className="text-sm text-slate-400">
                  Modifica los datos de {editingCourt.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="text-xl font-bold text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Nombre
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Descripción
                </label>
                <input
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Descripción opcional"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Orden (posición en la lista)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.sortOrder}
                  onChange={(e) =>
                    setEditForm({ ...editForm, sortOrder: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.indoor}
                    onChange={(e) =>
                      setEditForm({ ...editForm, indoor: e.target.checked })
                    }
                    id="edit-indoor"
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                  />
                  <label htmlFor="edit-indoor" className="text-sm text-slate-300">
                    Interior
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.active}
                    onChange={(e) =>
                      setEditForm({ ...editForm, active: e.target.checked })
                    }
                    id="edit-active"
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                  />
                  <label htmlFor="edit-active" className="text-sm text-slate-300">
                    Activa
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}