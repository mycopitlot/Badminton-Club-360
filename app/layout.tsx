import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club de Bádminton 360",
  description: "Gestión integral para clubes de bádminton",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning evita los errores causados por extensiones como Dark Reader
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
