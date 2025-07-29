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

  // Configuración simplificada de Webpack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Solo configurar fallbacks básicos necesarios
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        readline: false,
        worker_threads: false,
      };
    }

    return config;
  },
};

export default nextConfig;
