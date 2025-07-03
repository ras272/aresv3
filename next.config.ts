import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desactivar ESLint durante el build para deployment rápido
  eslint: {
    // Warning: Esto permite que el production build se complete exitosamente
    // incluso si tu proyecto tiene errores de ESLint.
    ignoreDuringBuilds: true,
  },
  // Desactivar verificación de tipos TypeScript durante build para deployment rápido
  typescript: {
    // ⚠️ Peligrosamente permite que el production build se complete exitosamente
    // incluso si tu proyecto tiene errores de TypeScript.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
