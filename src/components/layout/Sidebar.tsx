"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Heart,
  FileText,
  Home,
  Plus,
  Package,
  Wrench,
  Calendar,
  Truck,
  Receipt,
  Building2,
  BarChart3,
  HardDrive,
  CheckSquare,
  MessageCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    permission: "dashboard" as const,
  },
  {
    name: "Análisis",
    href: "/analisis",
    icon: BarChart3,
    permission: "reportes" as const,
  },
  {
    name: "Equipos",
    href: "/equipos",
    icon: Heart,
    permission: "equipos" as const,
  },
  {
    name: "Nuevo Equipo",
    href: "/equipos/nuevo",
    icon: Plus,
    permission: "equipos" as const,
    requiresWrite: true, // Solo mostrar si tiene permisos de escritura
  },
  {
    name: "Inventario Técnico",
    href: "/inventario-tecnico",
    icon: Wrench,
    permission: "inventarioTecnico" as const,
  },
  {
    name: "Calendario",
    href: "/calendario",
    icon: Calendar,
    permission: "calendario" as const,
  },
  {
    name: "Ingreso de Mercaderías",
    href: "/mercaderias",
    icon: Truck,
    permission: "mercaderias" as const,
  },
  {
    name: "Catálogo de Productos",
    href: "/productos",
    icon: Package,
    permission: "mercaderias" as const,
  },
  {
    name: "Gestión Documental",
    href: "/documentos",
    icon: FileText,
    permission: "documentos" as const,
  },
  {
    name: "Remisiones",
    href: "/remisiones",
    icon: Receipt,
    permission: "remisiones" as const,
  },

  {
    name: "Sistema de Archivos",
    href: "/archivos",
    icon: HardDrive,
    permission: "archivos" as const,
  },
  {
    name: "Tareas",
    href: "/tareas",
    icon: CheckSquare,
    permission: "tareas" as const,
    blocked: true, // 🚫 Página bloqueada - mostrar modal
  },
  {
    name: "Clínicas",
    href: "/clinicas",
    icon: Building2,
    permission: "clinicas" as const,
  },
  {
    name: "Stock",
    href: "/stock",
    icon: Package,
    permission: "stock" as const,
  },
  {
    name: "Reportes de Servicio",
    href: "/reportes",
    icon: FileText,
    permission: "reportes" as const,
  },
  {
    name: "Usuarios",
    href: "/usuarios",
    icon: Users,
    permission: "usuarios" as const,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  // 🚫 Función para manejar elementos bloqueados
  const handleBlockedClick = (itemName: string) => {
    toast.info(`${itemName} - Próximamente`, {
      description: "Esta funcionalidad estará disponible en una próxima actualización.",
      duration: 3000,
    });
  };

  // 🔧 Usar el sistema de autenticación real
  const canAccess = (permission: string) => {
    if (typeof window === "undefined") return false;

    try {
      const savedUser = localStorage.getItem("ares_current_user");
      if (!savedUser) return false;

      const user = JSON.parse(savedUser);
      if (!user) return false;

      // Super admin puede todo
      if (user.role === "super_admin") return true;

      // Definir permisos por rol
      const permissions = {
        admin: [
          "dashboard",
          "equipos",
          "inventario",
          "reportes",
          "stock",
          "remisiones",
          "usuarios",
          "calendario",
          "inventarioTecnico",
          "mercaderias",
          "documentos",
          "archivos",
          "tareas",
          "clinicas",
        ],
        gerente: [
          "dashboard",
          "equipos",
          "inventario",
          "reportes",
          "stock",
          "remisiones",
          "calendario",
          "inventarioTecnico",
          "mercaderias",
          "documentos",
          "archivos",
          "clinicas",
        ],
        contabilidad: [
          "dashboard",
          "reportes",
          "remisiones",
          "archivos",
          "clinicas",
          "documentos",
          "tareas",
        ],
        tecnico: [
          "dashboard",
          "equipos",
          "inventario",
          "calendario",
          "inventarioTecnico",
          "reportes",
          "stock",
        ],
        vendedor: [
          "dashboard",
          "equipos",
          "reportes",
          "remisiones",
          "clinicas",
          "mercaderias",
        ],
        cliente: ["dashboard", "equipos"],
      };

      const userPermissions =
        permissions[user.role as keyof typeof permissions] || [];
      return userPermissions.includes(permission);
    } catch {
      return false;
    }
  };

  // Filtrar navegación según permisos del usuario
  const filteredNavigation = navigation.filter((item) => {
    // Verificar permiso usando el sistema de auth real
    return canAccess(item.permission);
  });

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3"
        >
          <div className="flex-shrink-0">
            <img
              src="/isologo-ares.png"
              alt="ARES Paraguay"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-sidebar-foreground">ARES</h1>
            <p className="text-xs text-muted-foreground">PARAGUAY</p>
          </div>
        </motion.div>
      </div>

      {/* Theme Toggle */}
      <div className="border-b border-sidebar-border p-4">
        <ThemeToggle variant="switch" showLabel={false} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item, index) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {item.blocked ? (
                // 🚫 Elemento bloqueado - mostrar toast
                <button
                  onClick={() => handleBlockedClick(item.name)}
                  className={cn(
                    "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full text-left",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "cursor-pointer"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                    )}
                  />
                  {item.name}
                  {/* Indicador visual de que está bloqueado */}
                  <span className="ml-auto text-xs text-muted-foreground opacity-60">
                    🔒
                  </span>
                </button>
              ) : (
                // ✅ Elemento normal - navegar
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive
                        ? "text-sidebar-primary"
                        : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                    )}
                  />
                  {item.name}
                </Link>
              )}
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="text-xs text-muted-foreground">
          <p className="font-semibold">Ares Paraguay</p>
          <p>Sistema de Servicio Técnico</p>
          <p className="mt-1">v1.0.0 DEMO</p>
        </div>
      </div>
    </div>
  );
}
