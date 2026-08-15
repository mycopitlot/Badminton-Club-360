"use client";

import { useState, useEffect } from "react";

function formatMoney(value: any) {
  const amount = Number(value || 0);

  return amount.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function typeLabel(type: string) {
  if (type === "MEMBERSHIP") return "Cuota";
  if (type === "BOOKING") return "Reserva";
  if (type === "TOURNAMENT") return "Torneo";
  if (type === "DONATION") return "Donación";
  return "Otro";
}

function statusClass(status: string) {
  if (status === "PAID") return "bg-emerald-900/50 text-emerald-300";
  if (status === "PENDING") return "bg-amber-900/50 text-amber-300";
  if (status === "CANCELLED") return "bg-red-900/50 text-red-300";
  if (status === "REFUNDED") return "bg-slate-800 text-slate-300";
  return "bg-red-900/50 text-red-300";
}

function filterClass(active: boolean) {
  return (
    "rounded-lg px-4 py-2 text-sm font-semibold " +
    (active
      ? "bg-blue-600 text-white"
      : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800")
  );
}

export default function PagosPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    memberId: "",
    type: "MEMBERSHIP",
    concept: "",
    amount: "",
    method: "EFECTIVO",
    status: "PENDING",
  });

  const [quotaForm, setQuotaForm] = useState({
    month: "",
    amount: "30",
    concept: "",
  });

  async function fetchData() {
    setLoading(true);

    try {
      const [paymentsRes, membersRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/members"),
      ]);

      const paymentsData = await paymentsRes.json();
      const membersData = await membersRes.json();

      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error("Error cargando pagos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    setQuotaForm({
      month: year + "-" + month,
      amount: "30",
      concept: "",
    });

    fetchData();
  }, []);

  async function createPayment(event: React.FormEvent) {
    event.preventDefault();

    if (!paymentForm.memberId) {
      alert("Selecciona un socio.");
      return;
    }

    if (!paymentForm.concept) {
      alert("Escribe un concepto.");
      return;
    }

    const amount = Number(paymentForm.amount);

    if (!amount || amount <= 0) {
      alert("Introduce un importe válido.");
      return;
    }

    setCreating(true);

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId: paymentForm.memberId,
        type: paymentForm.type,
        concept: paymentForm.concept,
        amount,
        method: paymentForm.method,
        status: paymentForm.status,
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      alert(data.error || "No se pudo crear el pago.");
      return;
    }

    setPaymentForm({
      ...paymentForm,
      concept: "",
      amount: "",
    });

    fetchData();
  }

  async function markPaid(paymentId: string) {
    const res = await fetch("/api/payments/mark-paid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: paymentId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "No se pudo marcar como pagado.");
      return;
    }

    fetchData();
  }

  async function cancelPayment(paymentId: string) {
    if (!confirm("¿Quieres cancelar este pago?")) return;

    const res = await fetch("/api/payments/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: paymentId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "No se pudo cancelar el pago.");
      return;
    }

    fetchData();
  }

  async function generateQuotas(event: React.FormEvent) {
    event.preventDefault();

    if (!quotaForm.month) {
      alert("Selecciona el mes de la cuota.");
      return;
    }

    const amount = Number(quotaForm.amount);

    if (!amount || amount <= 0) {
      alert("Introduce un importe válido.");
      return;
    }

    setGenerating(true);

    const res = await fetch("/api/payments/generate-quotas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        month: quotaForm.month,
        amount,
        concept: quotaForm.concept,
      }),
    });

    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      alert(data.error || "No se pudieron generar las cuotas.");
      return;
    }

    alert(
      "Cuotas generadas: " +
        data.created +
        ". Omitidas: " +
        data.skipped +
        ". Socios activos: " +
        data.total +
        "."
    );

    fetchData();
  }

  const paidTotal = payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const pendingTotal = payments
    .filter((payment) => payment.status === "PENDING")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const membershipPendingTotal = payments
    .filter(
      (payment) =>
        payment.type === "MEMBERSHIP" && payment.status === "PENDING"
    )
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const filteredPayments =
    filter === "ALL"
      ? payments
      : filter === "PENDING"
        ? payments.filter((payment) => payment.status === "PENDING")
        : payments.filter((payment) => payment.type === "MEMBERSHIP");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Gestión de Pagos y Cuotas
        </h1>
        <p className="text-slate-400">
          Control de cobros, cuotas de socios y estado financiero del club.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Ingresos cobrados
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {formatMoney(paidTotal)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Pendientes de cobro
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-400">
            {formatMoney(pendingTotal)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Cuotas pendientes
          </p>
          <p className="mt-2 text-3xl font-bold text-red-400">
            {formatMoney(membershipPendingTotal)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Total movimientos
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {payments.length}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("ALL")} className={filterClass(filter === "ALL")}>
          Todos
        </button>

        <button onClick={() => setFilter("PENDING")} className={filterClass(filter === "PENDING")}>
          Pendientes
        </button>

        <button onClick={() => setFilter("MEMBERSHIP")} className={filterClass(filter === "MEMBERSHIP")}>
          Cuotas
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={createPayment}
          className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-lg"
        >
          <h2 className="mb-4 text-lg font-bold text-white">Nuevo pago</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Socio
              </label>
              <select
                value={paymentForm.memberId}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, memberId: e.target.value })
                }
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Selecciona un socio</option>
                {members.map((member: any) => (
                  <option key={member.id} value={member.id}>
                    {member.memberCode} - {member.user.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Tipo
              </label>
              <select
                value={paymentForm.type}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, type: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="MEMBERSHIP">Cuota</option>
                <option value="BOOKING">Reserva</option>
                <option value="TOURNAMENT">Torneo</option>
                <option value="DONATION">Donación</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Importe (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amount: e.target.value })
                }
                placeholder="30.00"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Concepto
              </label>
              <input
                value={paymentForm.concept}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, concept: e.target.value })
                }
                placeholder="Cuota mensual, inscripción torneo, alquiler pista..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Método
              </label>
              <select
                value={paymentForm.method}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, method: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TPV">TPV</option>
                <option value="ONLINE">Online</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Estado inicial
              </label>
              <select
                value={paymentForm.status}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, status: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Guardando..." : "Registrar pago"}
          </button>
        </form>

        <form
          onSubmit={generateQuotas}
          className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-lg"
        >
          <h2 className="mb-4 text-lg font-bold text-white">
            Generar cuotas mensuales
          </h2>

          <p className="mb-4 text-sm text-slate-400">
            Esta acción crea pagos pendientes de tipo cuota para todos los
            socios activos. Si ya existe una cuota con el mismo concepto para
            un socio, se omite para evitar duplicados.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Mes de la cuota
              </label>
              <input
                type="month"
                value={quotaForm.month}
                onChange={(e) =>
                  setQuotaForm({ ...quotaForm, month: e.target.value })
                }
                required
                style={{ colorScheme: "dark" }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Importe (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={quotaForm.amount}
                onChange={(e) =>
                  setQuotaForm({ ...quotaForm, amount: e.target.value })
                }
                placeholder="30.00"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Concepto personalizado
              </label>
              <input
                value={quotaForm.concept}
                onChange={(e) =>
                  setQuotaForm({ ...quotaForm, concept: e.target.value })
                }
                placeholder="Si se deja vacío: Cuota YYYY-MM"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {generating ? "Generando..." : "Generar cuotas para socios activos"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Socio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Concepto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Importe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Método
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
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  Cargando pagos...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  No hay pagos para este filtro.
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment: any) => (
                <tr key={payment.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {payment.member?.user?.fullName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {typeLabel(payment.type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {payment.concept}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                    {formatMoney(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {payment.method || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-1 text-xs font-semibold " +
                        statusClass(payment.status)
                      }
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {payment.status === "PENDING" && (
                        <button
                          onClick={() => markPaid(payment.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Cobrar
                        </button>
                      )}

                      {payment.status !== "CANCELLED" && payment.status !== "PAID" && (
                        <button
                          onClick={() => cancelPayment(payment.id)}
                          className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-950"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
