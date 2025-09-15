"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SidebarNew as Sidebar } from "./SidebarNew";
import { LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  fullWidth?: boolean;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  fullWidth = false,
}: DashboardLayoutProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 z-50 lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${fullWidth ? 'w-full' : 'lg:max-w-7xl lg:mx-auto'} flex items-center justify-between`}
          >
            {/* Left side - Mobile menu button + Title */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Mobile menu button - Only visible on mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors flex-shrink-0"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* Title - Responsive sizing */}
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 lg:mt-1 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* User info in header - Responsive */}
            {user && !isLoading && (
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
                {/* User info - Hidden on very small screens, shown on sm+ */}
                <div className="text-right hidden sm:block">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate max-w-24 sm:max-w-none">
                    {user.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-24 sm:max-w-none">
                    {user.email}
                  </p>
                </div>

                {/* Role badge - Responsive sizing and text */}
                <div
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 transition-all duration-200 ${
                    user.rol === "super_admin"
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : user.rol === "contabilidad"
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : user.rol === "admin"
                      ? "bg-secondary text-secondary-foreground border border-border"
                      : "bg-accent text-accent-foreground border border-border"
                  }`}
                >
                  <span className="sm:hidden">
                    {user.rol === "super_admin" && "Super"}
                    {user.rol === "admin" && "Admin"}
                    {user.rol === "contabilidad" && "Conta"}
                    {user.rol === "tecnico" && "Téc"}
                  </span>
                  <span className="hidden sm:inline lg:hidden">
                    {user.rol === "super_admin" && "Super Admin"}
                    {user.rol === "admin" && "Admin"}
                    {user.rol === "contabilidad" && "Contabilidad"}
                    {user.rol === "tecnico" && "Técnico"}
                  </span>
                  <span className="hidden lg:inline">
                    {user.rol === "super_admin" && "Super Administrador"}
                    {user.rol === "admin" && "Administrador"}
                    {user.rol === "contabilidad" && "Contabilidad"}
                    {user.rol === "tecnico" && "Técnico"}
                  </span>
                </div>

                {/* Logout button - Responsive sizing */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors flex-shrink-0"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="animate-pulse bg-muted h-8 w-24 rounded"></div>
                <div className="animate-pulse bg-muted h-8 w-16 rounded-full"></div>
              </div>
            )}
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`w-full ${fullWidth ? 'max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8' : 'lg:max-w-7xl lg:mx-auto px-2 sm:px-4 lg:px-6'} py-2 sm:py-4 lg:py-6 min-h-full`}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}