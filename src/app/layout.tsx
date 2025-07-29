import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper";
import { ThemeProvider } from "@/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ares DEMO - Sistema de Servicio Técnico",
  description: "Sistema de gestión de equipos médicos y mantenimientos para Ares Paraguay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-background text-foreground`}
      >
        <ThemeProvider>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
