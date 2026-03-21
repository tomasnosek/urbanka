import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { EditModeProvider } from "@/components/editor/EditModeContext";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const ranade = localFont({
  src: "../../public/Ranade-Medium.otf",
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
      <body className={`${inter.variable} ${ranade.variable}`}>
        <AuthProvider>
          <EditModeProvider>{children}</EditModeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
