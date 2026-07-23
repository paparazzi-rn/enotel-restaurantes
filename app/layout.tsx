import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enotel Porto de Galinhas | Restaurantes",
  description:
    "Restaurantes, cardápios e experiências gastronômicas do Enotel Porto de Galinhas.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/enotel-logo.png",
    shortcut: "/enotel-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
