"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  if (status === "ACTIVE") return "Activo";
  if (status === "INACTIVE") return "Inactivo";
  if (status === "SUSPENDED") return "Suspendido";
  return "Pendiente";
}

function statusColor(status: string) {
  if (status === "ACTIVE") return "bg-emerald-900/50 text-emerald-300";
  if (status === "INACTIVE") return "bg-slate-800 text-slate-300";
  if (status === "SUSPENDED") return "bg-red-900/50 text-red-300";
  return "bg-amber-900/50 text-amber-300";
}

export default function MemberCardPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    setMounted(true);

    async function fetchCard() {
      try {
        const res = await fetch("/api/members/" + memberId + "/card");
        const data = await res.json();

        if (res.ok) {
          setCard(data);
        } else {
          alert(data.error || "Error al cargar el carnet");
          router.push("/dashboard/socios");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar el carnet");
        router.push("/dashboard/socios");
      } finally {
        setLoading(false);
      }
    }

    fetchCard();
  }, [memberId, router]);

  const origin =
    mounted && typeof window !== "undefined" ? window.location.origin : "";
  const qrValue = card ? origin + card.cardUrl : "";

  useEffect(() => {
    if (!qrValue) return;

    QRCode.toDataURL(qrValue, {
      width: 280,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("Error generando QR:", err));
  }, [qrValue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Cargando carnet...</p>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  const initials = card.fullName
    .split(" ")
    .map((word: string) => word.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/socios"
            className="text-sm font-medium text-blue-400 hover:underline"
          >
            ← Volver a socios
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Carnet Digital
          </h1>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
        <div className="bg-blue-900/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-white">{card.clubName}</p>
              <p className="text-xs text-blue-300">Carnet de Socio</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
              B
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-start gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-700 text-3xl font-bold text-white">
              {initials}
            </div>

            <div className="flex-1 space-y-2">
              <p className="text-xl font-bold text-white">{card.fullName}</p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Código</p>
                  <p className="font-mono font-semibold text-blue-400">
                    {card.memberCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Categoría</p>
                  <p className="font-semibold text-white">
                    {card.category || "General"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Estado</p>
                  <span
                    className={
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " +
                      statusColor(card.status)
                    }
                  >
                    {statusLabel(card.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Socio desde</p>
                  <p className="font-semibold text-white">
                    {formatDate(card.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-white p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-600">
                Escanea para validar
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Presenta este código en la entrada del club
              </p>
              {card.hasActivePayment ? (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  ✓ Cuota al día
                </p>
              ) : (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  ✗ Cuota pendiente
                </p>
              )}
            </div>

            <div className="flex h-[150px] w-[150px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR del carnet"
                  className="h-[140px] w-[140px]"
                />
              ) : (
                <div className="h-[140px] w-[140px] animate-pulse bg-slate-200" />
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Club de Bádminton 360</span>
            <span>
              {card.imageAuthorization
                ? "Autorización de imagen: Sí"
                : "Autorización de imagen: No"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Último pago
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {card.lastPaymentDate
              ? formatDate(card.lastPaymentDate)
              : "Sin pagos"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Certificado médico
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {card.medicalCertificate ? "Presentado" : "Pendiente"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Autorización imagen
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {card.imageAuthorization ? "Concedida" : "No concedida"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm font-semibold text-white">
          URL del carnet (para el móvil del socio)
        </p>
        <p className="mt-1 break-all font-mono text-xs text-blue-400">
          {qrValue}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Esta URL puede enviarse al socio para que acceda a su carnet desde
          el móvil. El código QR contiene esta misma URL.
        </p>
      </div>
    </div>
  );
}