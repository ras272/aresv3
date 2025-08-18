"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  Wrench,
  User,
  Calendar,
  Plus,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Package,
  BarChart3,
  Target,
  Zap,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useTicketModal } from "@/components/servtec/TicketModal";

export default function ServTecPage() {
  const { equipos, mantenimientos, componentesDisponibles, loadAllData } =
    useAppStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  // Estados para filtros de mantenimientos
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todas");

  // Hook para el modal de tickets
  const { openModal: openTicketModal, TicketModal } = useTicketModal();

  useEffect(() => {
    // Forzar recarga de datos para obtener los números de reporte actualizados
    const loadData = async () => {
      try {
        await loadAllData();
        setLoading(false);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [loadAllData]);

  // Métricas de tickets cerrados
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const ticketsHoy = mantenimientos.filter((m) => {
    if (m.estado !== "Finalizado") return false;
    const fechaFinalizado = new Date(m.fecha);
    return fechaFinalizado >= inicioHoy;
  }).length;

  const ticketsSemana = mantenimientos.filter((m) => {
    if (m.estado !== "Finalizado") return false;
    const fechaFinalizado = new Date(m.fecha);
    return fechaFinalizado >= inicioSemana;
  }).length;

  // Filtrar mantenimientos según criterios seleccionados
  const mantenimientosFiltrados = mantenimientos
    .filter((m) => {
      // Filtro por estado
      if (filtroEstado !== "todos" && m.estado !== filtroEstado) {
        return false;
      }

      // Filtro por prioridad
      if (filtroPrioridad !== "todas" && m.prioridad !== filtroPrioridad) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Ordenar por fecha de creación (más recientes primero)
      const fechaA = new Date(a.createdAt || a.fecha);
      const fechaB = new Date(b.createdAt || b.fecha);
      return fechaB.getTime() - fechaA.getTime();
    });

  // Estadísticas rápidas
  const stats = {
    equiposTotal: equipos.length,
    equiposOperativos: equipos.filter(
      (e) => e.componentes?.every((c) => c.estado === "Operativo") ?? true
    ).length,
    equiposProblemas: equipos.filter(
      (e) => e.componentes?.some((c) => c.estado !== "Operativo") ?? false
    ).length,
    mantenimientosPendientes: mantenimientos.filter(
      (m) => m.estado === "Pendiente"
    ).length,
    mantenimientosCriticos: mantenimientos.filter(
      (m) => m.estado === "Pendiente" && m.prioridad === "Crítica"
    ).length,
    stockBajo: componentesDisponibles.filter((c) => c.cantidadDisponible <= 2)
      .length,
    ticketsHoy,
    ticketsSemana,
  };

  const crearTicketMantenimiento = (equipoId?: string) => {
    // Si se proporciona un equipoId, pre-seleccionar el equipo en el modal
    if (equipoId) {
      // TODO: Pre-seleccionar equipo en el modal
    }
    openTicketModal();
  };

  const handleTicketCreated = (ticketId: string) => {
    toast.success("¡Ticket creado exitosamente!", {
      description: `El ticket ${ticketId} ha sido creado y está listo para asignación.`,
    });
  };

  const navegarAEquipo = (equipoId: string) => {
    if (equipoId) {
      router.push(`/equipo/${equipoId}`);
    } else {
      toast.error("No se puede navegar al equipo", {
        description: "El equipo asociado no está disponible.",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Activity className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Cargando ServTec...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout fullWidth={true}>
      <div className="w-full h-full bg-gray-50 overflow-auto">
        <div className="w-full min-h-full p-2 sm:p-4 lg:p-6">
          {/* Header de ServTec */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <Activity className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
                  <span className="truncate">ServTec</span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1 truncate">
                  Centro de Control de Servicio Técnico
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                <Button size="sm" onClick={() => crearTicketMantenimiento()} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Nuevo Ticket</span>
                  <span className="sm:hidden">Ticket</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Métricas Clave */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card className="overflow-hidden">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                      {stats.mantenimientosPendientes}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Tickets Pendientes</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 truncate">
                      {stats.mantenimientosCriticos}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Críticos</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-red-100 rounded-lg flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 truncate">
                      {stats.equiposTotal}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Total Equipos</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 truncate">
                      {stats.ticketsHoy}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Completados Hoy</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista Completa de Mantenimientos */}
          <Card className="mt-4 sm:mt-6 overflow-hidden">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm sm:text-base truncate">Todos los Mantenimientos ({mantenimientos.length})</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                  <select
                    className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm w-full sm:w-auto"
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    value={filtroEstado}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                  <select
                    className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm w-full sm:w-auto"
                    onChange={(e) => setFiltroPrioridad(e.target.value)}
                    value={filtroPrioridad}
                  >
                    <option value="todas">Todas las prioridades</option>
                    <option value="Crítica">Crítica</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mantenimientosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No hay mantenimientos que coincidan con los filtros</p>
                  </div>
                ) : (
                  mantenimientosFiltrados.map((mantenimiento) => {
                    const equipo = equipos.find(
                      (e) => e.id === mantenimiento.equipoId
                    );
                    const fechaCreacion = new Date(
                      mantenimiento.fecha || mantenimiento.created_at
                    );
                    const diasDesdeCreacion = Math.floor(
                      (new Date().getTime() - fechaCreacion.getTime()) /
                        (1000 * 3600 * 24)
                    );

                    return (
                      <div
                        key={mantenimiento.id}
                        className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer hover:border-blue-300 overflow-hidden"
                        onClick={() => navegarAEquipo(mantenimiento.equipoId)}
                        title={`Ver equipo: ${equipo?.nombreEquipo || "Equipo N/A"}`}
                      >
                        <div className="flex flex-col gap-3">
                          {/* Header with title and key badge */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate flex-1 min-w-0">
                              {equipo?.nombreEquipo || "Equipo N/A"}
                            </h3>
                            {mantenimiento.numeroReporte && (
                              <Badge className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0">
                                {mantenimiento.numeroReporte}
                              </Badge>
                            )}
                          </div>

                          {/* Badges row */}
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            <Badge
                              className={`text-xs font-medium ${
                                mantenimiento.estado === "Finalizado"
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : mantenimiento.estado === "En proceso"
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
                              }`}
                            >
                              {mantenimiento.estado}
                            </Badge>
                            <Badge
                              className={`text-xs font-medium ${
                                mantenimiento.prioridad === "Crítica"
                                  ? "bg-red-100 text-red-800 border-red-300"
                                  : mantenimiento.prioridad === "Alta"
                                  ? "bg-orange-100 text-orange-800 border-orange-300"
                                  : mantenimiento.prioridad === "Media"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  : "bg-gray-100 text-gray-800 border-gray-300"
                              }`}
                            >
                              {mantenimiento.prioridad}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                            {mantenimiento.descripcion}
                          </p>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1 min-w-0">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{equipo?.cliente || "Cliente N/A"}</span>
                            </span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Calendar className="w-3 h-3" />
                              {diasDesdeCreacion === 0
                                ? "Hoy"
                                : diasDesdeCreacion === 1
                                ? "Ayer"
                                : `Hace ${diasDesdeCreacion} días`}
                            </span>
                            {mantenimiento.tecnicoAsignado && (
                              <span className="flex items-center gap-1 min-w-0">
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{mantenimiento.tecnicoAsignado}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Creacion de Tickets */}
      <TicketModal onTicketCreated={handleTicketCreated} />
    </DashboardLayout>
  );
}
