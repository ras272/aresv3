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
        <div className="w-full min-h-full p-4">
          {/* Header de ServTec */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Activity className="w-8 h-8 text-blue-600" />
                  ServTec
                </h1>
                <p className="text-gray-600 mt-1">
                  Centro de Control de Servicio Técnico
                </p>
              </div>
              <div className="flex gap-3">
                <Button size="sm" onClick={() => crearTicketMantenimiento()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Ticket
                </Button>
              </div>
            </div>
          </div>

          {/* Métricas Clave */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.mantenimientosPendientes}
                    </p>
                    <p className="text-sm text-gray-600">Tickets Pendientes</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.mantenimientosCriticos}
                    </p>
                    <p className="text-sm text-gray-600">Críticos</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.equiposTotal}
                    </p>
                    <p className="text-sm text-gray-600">Total Equipos</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.ticketsHoy}
                    </p>
                    <p className="text-sm text-gray-600">Completados Hoy</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista Completa de Mantenimientos */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Todos los Mantenimientos ({mantenimientos.length})
                </div>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    value={filtroEstado}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                  <select
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
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
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer hover:border-blue-300"
                        onClick={() => navegarAEquipo(mantenimiento.equipoId)}
                        title={`Ver equipo: ${equipo?.nombreEquipo || "Equipo N/A"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {equipo?.nombreEquipo || "Equipo N/A"}
                              </h3>
                              {mantenimiento.numeroReporte && (
                                <Badge className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200">
                                  {mantenimiento.numeroReporte}
                                </Badge>
                              )}
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

                            <p className="text-sm text-gray-600 mb-2">
                              {mantenimiento.descripcion}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {equipo?.cliente || "Cliente N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {diasDesdeCreacion === 0
                                  ? "Hoy"
                                  : diasDesdeCreacion === 1
                                  ? "Ayer"
                                  : `Hace ${diasDesdeCreacion} días`}
                              </span>
                              {mantenimiento.tecnicoAsignado && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {mantenimiento.tecnicoAsignado}
                                </span>
                              )}
                            </div>
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
