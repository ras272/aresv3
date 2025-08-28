"use client";

import { useState, useEffect } from "react";
// Import from specific modules for better reliability
import {
  getEquiposByCliente,
  getEstadisticasEquiposByCliente,
  type EquipoClienteStats,
} from "@/lib/database/equipos";
import {
  getMantenimientosByCliente,
  getEstadisticasMantenimientosByCliente,
  getProximosMantenimientosByCliente,
  type MantenimientoClienteStats,
} from "@/lib/database/mantenimientos";
import { Equipo, Mantenimiento } from "@/types";

// ===============================================
// INTERFACES
// ===============================================

interface EquiposClienteProps {
  clienteNombre: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TabType {
  id: "equipos" | "mantenimientos" | "estadisticas";
  label: string;
  icon: string;
}

// ===============================================
// COMPONENT
// ===============================================

export function EquiposCliente({
  clienteNombre,
  isOpen,
  onClose,
}: EquiposClienteProps) {
  // ===============================================
  // STATE MANAGEMENT
  // ===============================================

  const [activeTab, setActiveTab] = useState<TabType["id"]>("equipos");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equiposStats, setEquiposStats] = useState<EquipoClienteStats | null>(
    null
  );
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [mantenimientosStats, setMantenimientosStats] =
    useState<MantenimientoClienteStats | null>(null);
  const [proximosMantenimientos, setProximosMantenimientos] = useState<
    Mantenimiento[]
  >([]);

  // ===============================================
  // TABS CONFIGURATION
  // ===============================================

  const tabs: TabType[] = [
    { id: "equipos", label: "Equipos", icon: "🏥" },
    { id: "mantenimientos", label: "Mantenimientos", icon: "🔧" },
    { id: "estadisticas", label: "Estadísticas", icon: "📊" },
  ];

  // ===============================================
  // EFFECTS
  // ===============================================

  useEffect(() => {
    if (isOpen && clienteNombre) {
      loadClienteData();
    }
  }, [isOpen, clienteNombre]);

  // ===============================================
  // DATA LOADING FUNCTIONS
  // ===============================================

  const loadClienteData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Loading complete client data for:", clienteNombre);

      // Load all data in parallel for better performance
      const [
        equiposData,
        equiposStatsData,
        mantenimientosData,
        mantenimientosStatsData,
        proximosData,
      ] = await Promise.all([
        getEquiposByCliente(clienteNombre),
        getEstadisticasEquiposByCliente(clienteNombre),
        getMantenimientosByCliente(clienteNombre),
        getEstadisticasMantenimientosByCliente(clienteNombre),
        getProximosMantenimientosByCliente(clienteNombre, 30),
      ]);

      // Update all states
      setEquipos(equiposData);
      setEquiposStats(equiposStatsData);
      setMantenimientos(mantenimientosData);
      setMantenimientosStats(mantenimientosStatsData);
      setProximosMantenimientos(proximosData);

      console.log("✅ Client data loaded successfully:", {
        equipos: equiposData.length,
        mantenimientos: mantenimientosData.length,
        proximos: proximosData.length,
      });
    } catch (error) {
      console.error("❌ Error loading client data:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // UTILITY FUNCTIONS
  // ===============================================

  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case "Operativo":
        return "bg-green-100 text-green-800";
      case "En Mantenimiento":
        return "bg-yellow-100 text-yellow-800";
      case "Fuera de Servicio":
        return "bg-red-100 text-red-800";
      case "En Reparación":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ===============================================
  // RENDER FUNCTIONS
  // ===============================================

  const renderEquiposTab = () => (
    <div className="space-y-6">
      {/* Equipment Statistics Cards */}
      {equiposStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-600 text-sm">Total Equipos</h3>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {equiposStats.totalEquipos}
            </p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-600 text-sm">Operativos</h3>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {equiposStats.equiposPorEstado.operativo}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    equiposStats.totalEquipos > 0
                      ? (equiposStats.equiposPorEstado.operativo /
                          equiposStats.totalEquipos) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-600 text-sm">
              En Mantenimiento
            </h3>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {equiposStats.equiposPorEstado.enMantenimiento}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    equiposStats.totalEquipos > 0
                      ? (equiposStats.equiposPorEstado.enMantenimiento /
                          equiposStats.totalEquipos) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-600 text-sm">
              Fuera de Servicio
            </h3>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {equiposStats.equiposPorEstado.fueraDeServicio}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-red-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    equiposStats.totalEquipos > 0
                      ? (equiposStats.equiposPorEstado.fueraDeServicio /
                          equiposStats.totalEquipos) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment List */}
      <div className="space-y-4">
        {equipos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4 opacity-50">🏥</div>
            <p className="text-gray-600 text-lg font-medium">
              No hay equipos registrados
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Los equipos aparecerán aquí cuando se registren desde mercaderías
            </p>
          </div>
        ) : (
          equipos.map((equipo) => (
            <div
              key={equipo.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {equipo.nombreEquipo}
                  </h3>
                  <p className="text-gray-600 font-medium">
                    {equipo.marca} - {equipo.modelo}
                  </p>
                  <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {equipo.ubicacion}
                    </span>
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(equipo.fechaEntrega || equipo.createdAt)}
                    </span>
                    {equipo.numeroSerieBase && (
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                          />
                        </svg>
                        {equipo.numeroSerieBase}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${getEstadoColor(
                      "Operativo"
                    )}`}
                  >
                    {"Operativo"}
                  </span>
                </div>
              </div>

              {/* Components */}
              {equipo.componentes &&
                equipo.componentes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Componentes ({equipo.componentes.length}):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {equipo.componentes.map((comp: any) => (
                        <div
                          key={comp.id}
                          className="bg-gray-50 p-3 rounded-md"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-900">
                                {comp.nombre}
                              </span>
                              {comp.numeroSerie && (
                                <p className="text-xs text-gray-500 mt-1">
                                  S/N: {comp.numeroSerie}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs ${getEstadoColor(
                                comp.estado
                              )}`}
                            >
                              {comp.estado}
                            </span>
                          </div>
                          {comp.observaciones && (
                            <div className="mt-2 p-3 bg-gray-50 border-l-2 border-l-gray-300 rounded-r-sm">
                              <p className="text-sm text-gray-700">
                                {comp.observaciones}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Equipment Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  📋 Ver Historial
                </button>
                <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                  🔧 Programar Mantenimiento
                </button>
                <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  📊 Ver Detalles
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderMantenimientosTab = () => (
    <div className="space-y-6">
      {/* Maintenance Statistics */}
      {mantenimientosStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-600 text-sm">Total</h3>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {mantenimientosStats.totalMantenimientos}
            </p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-600 text-sm">Pendientes</h3>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {mantenimientosStats.mantenimientosPorEstado.pendiente}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    mantenimientosStats.totalMantenimientos > 0
                      ? (mantenimientosStats.mantenimientosPorEstado.pendiente /
                          mantenimientosStats.totalMantenimientos) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-600 text-sm">Finalizados</h3>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {mantenimientosStats.mantenimientosPorEstado.finalizado}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    mantenimientosStats.totalMantenimientos > 0
                      ? (mantenimientosStats.mantenimientosPorEstado
                          .finalizado /
                          mantenimientosStats.totalMantenimientos) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-600 text-sm">En Proceso</h3>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {mantenimientosStats.mantenimientosPorEstado.enProceso}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    mantenimientosStats.totalMantenimientos > 0
                      ? (mantenimientosStats.mantenimientosPorEstado.enProceso /
                          mantenimientosStats.totalMantenimientos) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Maintenance */}
      {proximosMantenimientos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
            Próximos Mantenimientos (30 días)
          </h3>
          <div className="space-y-3">
            {proximosMantenimientos.slice(0, 3).map((mant) => {
              // Encontrar el equipo asociado a este mantenimiento
              const equipoAsociado = equipos.find(e => e.id === mant.equipoId);
              return (
                <div
                  key={mant.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-gray-900">
                      {equipoAsociado?.nombreEquipo || "Equipo N/A"}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({mant.tipo})
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded">
                    {formatDate(mant.fechaProgramada || mant.fecha)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Maintenance List */}
      <div className="space-y-4">
        {mantenimientos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4 opacity-50">🔧</div>
            <p className="text-gray-600 text-lg font-medium">
              No hay mantenimientos registrados
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Los mantenimientos aparecerán aquí cuando se programen
            </p>
          </div>
        ) : (
          mantenimientos.slice(0, 10).map((mantenimiento) => {
            // Encontrar el equipo asociado a este mantenimiento
            const equipoAsociado = equipos.find(e => e.id === mantenimiento.equipoId);
            return (
              <div
                key={mantenimiento.id}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {equipoAsociado?.nombreEquipo || "Equipo N/A"}
                    </h4>
                    <p className="text-sm text-gray-600 font-medium">
                      {mantenimiento.tipo}
                    </p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(mantenimiento.fechaProgramada || mantenimiento.fecha)}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${getEstadoColor(
                      mantenimiento.estado
                    )}`}
                  >
                    {mantenimiento.estado}
                  </span>
                </div>
                {mantenimiento.descripcion && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {mantenimiento.descripcion}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderEstadisticasTab = () => (
    <div className="space-y-6">
      {equiposStats && mantenimientosStats && (
        <>
          {/* General Overview */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Resumen General
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-semibold text-gray-800">
                  {equiposStats.totalEquipos}
                </p>
                <p className="text-sm text-gray-600 mt-1">Equipos Totales</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-semibold text-gray-800">
                  {equiposStats.totalComponentes}
                </p>
                <p className="text-sm text-gray-600 mt-1">Componentes</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-semibold text-gray-800">
                  {mantenimientosStats.totalMantenimientos}
                </p>
                <p className="text-sm text-gray-600 mt-1">Mantenimientos</p>
              </div>
            </div>
          </div>

          {/* Equipment Types */}
          {equiposStats.tiposEquipos.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Tipos de Equipos
              </h3>
              <div className="flex flex-wrap gap-2">
                {equiposStats.tiposEquipos.map((tipo, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    {tipo}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Brands */}
          {equiposStats.marcas.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Marcas
              </h3>
              <div className="flex flex-wrap gap-2">
                {equiposStats.marcas.map((marca, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    {marca}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          {equiposStats.ubicaciones.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Ubicaciones
              </h3>
              <div className="space-y-3">
                {equiposStats.ubicaciones.map((ubicacion, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span className="text-sm text-gray-700 font-medium">
                      {ubicacion}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Activity */}
          {equiposStats.ultimoEquipoInstalado && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Última Actividad
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">
                  {equiposStats.ultimoEquipoInstalado.nombre}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Instalado el{" "}
                  {formatDate(equiposStats.ultimoEquipoInstalado.fechaEntrega)}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ===============================================
  // MAIN RENDER
  // ===============================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Información de Cliente
            </h2>
            <p className="text-gray-500 mt-1 font-medium">{clienteNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-gray-800 border-b-2 border-gray-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
              }`}
            >
              <span className="mr-2 text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Cargando información del cliente...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-600 text-lg font-medium">
                Error al cargar la información
              </p>
              <p className="text-gray-500 text-sm mt-2">{error}</p>
              <button
                onClick={loadClienteData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {activeTab === "equipos" && renderEquiposTab()}
              {activeTab === "mantenimientos" && renderMantenimientosTab()}
              {activeTab === "estadisticas" && renderEstadisticasTab()}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleString("es-ES")}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
