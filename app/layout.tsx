import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Rifly | Rifas online fáciles y rápidas", template: "%s | Rifly" },
  description: "Descubre rifas disponibles, elige tus números y reserva fácilmente desde tu celular.",
  applicationName: "Rifly",
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
  openGraph: { title: "Rifly | Elige tu número. Prueba tu suerte.", description: "Rifas pequeñas, transparentes y fáciles de compartir.", siteName: "Rifly", locale: "es_CO", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
