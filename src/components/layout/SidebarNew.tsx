"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  HardDrive,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SimpleThemeToggle } from "@/components/ui/simple-theme-toggle";
import { ModernThemeToggle } from "@/components/ui/modern-theme-toggle";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { hasPermission } from "@/types/auth";
import type { UserRole } from "@/types/auth";

// 🎯 Tipos para elementos de navegación
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  badge?: "new" | "admin" | "beta";
  blocked?: boolean;
  requiresWrite?: boolean;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

// 🎯 Navegación organizada por categorías
const navigationSections: NavigationSection[] = [
  {
    title: "Principal",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: Home,
        permission: "dashboard",
        badge: "new",
      },
      {
        name: "ServTec",
        href: "/servtec",
        icon: Activity,
        permission: "servtec",
        badge: "new",
      },
    ],
  },
  {
    title: "Equipos & Servicio",
    items: [
      {
        name: "Equipos",
        href: "/equipos",
        icon: Heart,
        permission: "equipos",
      },
      {
        name: "Nuevo Equipo",
        href: "/equipos/nuevo",
        icon: Plus,
        permission: "equipos",
        requiresWrite: true,
      },
      {
        name: "Calendario",
        href: "/calendario",
        icon: Calendar,
        permission: "calendario",
      },
    ],
  },
  {
    title: "Inventario & Stock",
    items: [
      {
        name: "Ingreso de Mercaderías",
        href: "/mercaderias",
        icon: Truck,
        permission: "mercaderias",
      },
      {
        name: "Catálogo de Productos",
        href: "/productos",
        icon: Package,
        permission: "productos",
      },
      {
        name: "Stock General",
        href: "/stock",
        icon: Package,
        permission: "stock",
      },
      {
        name: "Repuestos",
        href: "/repuestos",
        icon: Wrench,
        permission: "repuestos",
      },
    ],
  },
  {
    title: "Documentos & Archivos",
    items: [
      {
        name: "Gestión Documental",
        href: "/documentos",
        icon: FileText,
        permission: "documentos",
      },
      {
        name: "Remisiones",
        href: "/remisiones",
        icon: Receipt,
        permission: "remisiones",
      },
      {
        name: "Sistema de Archivos",
        href: "/archivos",
        icon: HardDrive,
        permission: "archivos",
      },
      {
        name: "Reportes de Servicio",
        href: "/reportes",
        icon: FileText,
        permission: "reportes",
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        name: "Clínicas",
        href: "/clinicas",
        icon: Building2,
        permission: "clinicas",
      },
      {
        name: "Usuarios",
        href: "/usuarios",
        icon: Users,
        permission: "usuarios",
        badge: "admin",
      },
    ],
  },
];

export function SidebarNew() {
  const pathname = usePathname();
  const { user, hasPermission: userHasPermission } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "Principal",
    "Equipos & Servicio",
    "Inventario & Stock",
    "Documentos & Archivos",
    "Administración",
  ]);

  // 🚫 Función para manejar elementos bloqueados
  const handleBlockedClick = (itemName: string) => {
    toast.info(`${itemName} - Próximamente`, {
      description:
        "Esta funcionalidad estará disponible en una próxima actualización.",
      duration: 3000,
    });
  };

  // 🔧 Usar el nuevo sistema de autenticación con AuthProvider
  const canAccess = (permission: string) => {
    if (!user) return false;

    // Mapear permisos de navegación a permisos del sistema de autenticación
    const permissionMap: Record<string, string> = {
      dashboard: "dashboard.view",
      equipos: "equipos.view",
      inventario: "inventario.view",
      inventarioTecnico: "inventario.view",
      reportes: "reportes.view",
      stock: "stock.view",
      remisiones: "remisiones.view",
      usuarios: "usuarios.view",
      calendario: "calendario.view",
      mercaderias: "mercaderias.view",
      documentos: "documentos.view",
      archivos: "archivos.view",
      tareas: "tareas.manage",
      clinicas: "clinicas.view",
      productos: "productos.view",
      servtec: "servtec.view",
      repuestos: "repuestos.view",
    };

    const mappedPermission = permissionMap[permission] || permission;
    return userHasPermission(mappedPermission);
  };

  // Filtrar secciones según permisos del usuario
  const filteredSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const hasAccess = canAccess(item.permission);
        // console.log(`🔍 SidebarNew: Checking access for ${item.name} (${item.permission}):`, hasAccess);
        return hasAccess;
      }),
    }))
    .filter((section) => section.items.length > 0);

  // Toggle sección expandida/colapsada
  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((title) => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  // Renderizar badge
  const renderBadge = (badge?: string) => {
    if (!badge) return null;

    const badgeConfig = {
      new: {
        text: "Nuevo",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      admin: {
        text: "Admin",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      beta: {
        text: "Beta",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
    };

    const config = badgeConfig[badge as keyof typeof badgeConfig];
    if (!config) return null;

    return (
      <Badge
        variant="secondary"
        className={cn("text-xs px-1.5 py-0.5 ml-auto", config.className)}
      >
        {config.text}
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar border-r border-sidebar-border relative transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-70"
      )}
    >
      {/* Botón de colapsar/expandir */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-10 bg-sidebar border border-sidebar-border rounded-full p-1.5 hover:bg-sidebar-accent transition-colors shadow-md"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
        )}
      </button>

      {/* Logo */}
      <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <img
              src="/isologo-ares.png"
              alt="ARES Paraguay"
              className="h-12 w-auto object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-sidebar-foreground">
                ARES
              </h1>
              <p className="text-xs text-muted-foreground">PARAGUAY</p>
            </div>
          )}
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="border-b border-sidebar-border p-4">
        <div
          className={cn(
            "flex",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          <ModernThemeToggle 
            showLabel={!isCollapsed} 
            variant={isCollapsed ? "minimal" : "switch"}
            className="transition-all duration-300"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredSections.map((section, sectionIndex) => {
          const isExpanded = expandedSections.includes(section.title);

          return (
            <div key={section.title} className="space-y-1">
              {/* Título de sección */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-sidebar-foreground transition-colors group"
                >
                  <span>{section.title}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 group-hover:text-sidebar-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 group-hover:text-sidebar-foreground" />
                  )}
                </button>
              )}

              {/* Items de la sección */}
              {(isCollapsed || isExpanded) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                      <div key={item.name}>
                        {item.blocked ? (
                          // 🚫 Elemento bloqueado
                          <button
                            onClick={() => handleBlockedClick(item.name)}
                            className={cn(
                              "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full text-left",
                              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              "hover:scale-[1.02] hover:shadow-sm",
                              isCollapsed ? "justify-center" : "justify-start"
                            )}
                            title={isCollapsed ? item.name : undefined}
                          >
                            <item.icon
                              className={cn(
                                "h-5 w-5 flex-shrink-0 transition-colors",
                                "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                                isCollapsed ? "mr-0" : "mr-3"
                              )}
                            />
                            {!isCollapsed && (
                              <div className="flex items-center justify-between flex-1 min-w-0">
                                <span className="truncate">{item.name}</span>
                                <span className="text-xs text-muted-foreground opacity-60 ml-2">
                                  🔒
                                </span>
                              </div>
                            )}
                          </button>
                        ) : (
                          // ✅ Elemento normal
                          <Link
                            href={item.href}
                            className={cn(
                              "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                              "hover:scale-[1.02] hover:shadow-sm",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border border-sidebar-accent/20"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              isCollapsed ? "justify-center" : "justify-start"
                            )}
                            title={isCollapsed ? item.name : undefined}
                          >
                            <item.icon
                              className={cn(
                                "h-5 w-5 flex-shrink-0 transition-colors",
                                isActive
                                  ? "text-sidebar-primary"
                                  : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                                isCollapsed ? "mr-0" : "mr-3"
                              )}
                            />
                            {!isCollapsed && (
                              <div className="flex items-center justify-between flex-1 min-w-0">
                                <span className="truncate">{item.name}</span>
                                {renderBadge(item.badge)}
                              </div>
                            )}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Separador entre secciones */}
              {!isCollapsed && sectionIndex < filteredSections.length - 1 && (
                <div className="h-px bg-sidebar-border my-3" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        {!isCollapsed ? (
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold">Ares Paraguay</p>
            <p className="mt-1">v3.0.0</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-sidebar-accent rounded-lg flex items-center justify-center">
              <Activity className="h-4 w-4 text-sidebar-primary" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
