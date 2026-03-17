import type { Metadata } from "next";
import { Inter, Libre_Baskerville } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { EditModeProvider } from "@/components/editor/EditModeContext";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Urbanka — Přehled investičních projektů",
  description:
    "Transparentní přehled investičních projektů vaší obce. Moderní informační portál pro občany.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={`${inter.variable} ${libreBaskerville.variable}`}>
        <AuthProvider>
          <EditModeProvider>{children}</EditModeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
