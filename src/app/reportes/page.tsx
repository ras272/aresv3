"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useAppStore";
import { usePermissions } from "@/components/PermissionGuard";
import {
  FileText,
  Search,
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Download,
  TrendingUp,
  Building,
  Clock,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { WhatsAppReportModal } from "@/components/reportes/WhatsAppReportModal";
import { RepuestosViewer } from "@/components/reportes/RepuestosViewer";

export default function ReportesPage() {
  const { mantenimientos, equipos, updateMantenimiento, deleteMantenimiento } =
    useAppStore();
  const { getCurrentUser } = usePermissions();
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("todos");
  const [filtroCliente, setFiltroCliente] = useState("todos");
  const [modalEditarReporte, setModalEditarReporte] = useState(false);
  const [modalVerReporte, setModalVerReporte] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<any>(null);
  const [reporteParaVer, setReporteParaVer] = useState<any>(null);
  const [precioEditado, setPrecioEditado] = useState("");
  const [comentariosEditados, setComentariosEditados] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Estados para tracking de facturación externa
  const [estadoFacturacion, setEstadoFacturacion] = useState("Pendiente");
  const [numeroFacturaExterna, setNumeroFacturaExterna] = useState("");
  const [fechaFacturacion, setFechaFacturacion] = useState("");
  const [archivoFacturaPDF, setArchivoFacturaPDF] = useState<File | null>(null);

  // Estados para eliminación de reportes
  const [modalConfirmarEliminacion, setModalConfirmarEliminacion] =
    useState(false);
  const [reporteParaEliminar, setReporteParaEliminar] = useState<any>(null);
  const [eliminando, setEliminando] = useState(false);

  // Estados para WhatsApp
  const [modalWhatsApp, setModalWhatsApp] = useState(false);
  const [reporteParaWhatsApp, setReporteParaWhatsApp] = useState<any>(null);

  // Solo mostrar mantenimientos finalizados con reporte generado
  const reportesGenerados = useMemo(() => {
    return mantenimientos
      .filter((m) => m.estado === "Finalizado" && m.reporteGenerado)
      .map((mantenimiento) => {
        const equipo = equipos.find((e) => e.id === mantenimiento.equipoId);
        const componente = mantenimiento.componenteId
          ? equipo?.componentes?.find(
              (c) => c.id === mantenimiento.componenteId
            )
          : null;

        return {
          ...mantenimiento,
          equipo,
          componente,
          cliente: equipo?.cliente || "N/A",
          nombreEquipo: equipo?.nombreEquipo || "N/A",
          ubicacion: equipo?.ubicacion || "N/A",
        };
      })
      .sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
  }, [mantenimientos, equipos]);

  // Filtrar reportes
  const reportesFiltrados = useMemo(() => {
    return reportesGenerados.filter((reporte) => {
      const matchBusqueda =
        !busqueda ||
        reporte.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        reporte.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        reporte.nombreEquipo.toLowerCase().includes(busqueda.toLowerCase());

      const matchCliente =
        filtroCliente === "todos" || reporte.cliente === filtroCliente;

      const matchFecha =
        filtroFecha === "todos" ||
        (() => {
          const fechaReporte = new Date(reporte.fecha);
          const hoy = new Date();
          const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
          const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);

          switch (filtroFecha) {
            case "7dias":
              return fechaReporte >= hace7Dias;
            case "30dias":
              return fechaReporte >= hace30Dias;
            case "hoy":
              return fechaReporte.toDateString() === hoy.toDateString();
            default:
              return true;
          }
        })();

      return matchBusqueda && matchCliente && matchFecha;
    });
  }, [reportesGenerados, busqueda, filtroCliente, filtroFecha]);

  // Obtener clientes únicos para el filtro
  const clientesUnicos = useMemo(() => {
    return [...new Set(reportesGenerados.map((r) => r.cliente))].sort();
  }, [reportesGenerados]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const reportesConPrecio = reportesFiltrados.filter(
      (r) => r.precioServicio && r.precioServicio > 0
    );
    const ingresosTotales = reportesConPrecio.reduce(
      (total, r) => total + (r.precioServicio || 0),
      0
    );
    const promedioServicio =
      reportesConPrecio.length > 0
        ? ingresosTotales / reportesConPrecio.length
        : 0;
    const sinPrecio = reportesFiltrados.filter(
      (r) => !r.precioServicio || r.precioServicio === 0
    ).length;

    return {
      totalReportes: reportesFiltrados.length,
      ingresosTotales,
      promedioServicio,
      reportesSinPrecio: sinPrecio,
    };
  }, [reportesFiltrados]);

  const formatearGuaranies = (valor: number) => {
    return `₲ ${valor.toLocaleString("es-PY")}`;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const abrirModalEditar = (reporte: any) => {
    setReporteSeleccionado(reporte);
    setPrecioEditado(reporte.precioServicio?.toString() || "");
    setComentariosEditados(reporte.comentarios || "");

    // 📋 Cargar datos de tracking de facturación externa
    setEstadoFacturacion(reporte.estadoFacturacion || "Pendiente");
    setNumeroFacturaExterna(reporte.numeroFacturaExterna || "");
    setFechaFacturacion(reporte.fechaFacturacion || "");
    setArchivoFacturaPDF(null);

    setModalEditarReporte(true);
  };

  const abrirModalVer = (reporte: any) => {
    setReporteParaVer(reporte);
    setModalVerReporte(true);
  };

  const abrirModalWhatsApp = (reporte: any) => {
    setReporteParaWhatsApp(reporte);
    setModalWhatsApp(true);
  };

  const guardarCambiosReporte = async () => {
    if (!reporteSeleccionado) return;

    setGuardando(true);
    try {
      const precioNumerico = precioEditado
        ? parseFloat(precioEditado)
        : undefined;

      // 📋 Preparar datos de facturación externa si se proporcionaron
      let archivoFacturaPDFData = undefined;
      if (archivoFacturaPDF) {
        // Crear URL real del archivo para visualización
        const fileUrl = URL.createObjectURL(archivoFacturaPDF);
        archivoFacturaPDFData = {
          nombre: archivoFacturaPDF.name,
          url: fileUrl,
          tamaño: archivoFacturaPDF.size,
          file: archivoFacturaPDF, // Guardamos el archivo original también
        };
      }

      await updateMantenimiento(reporteSeleccionado.id, {
        precioServicio: precioNumerico,
        comentarios: comentariosEditados,

        // 📋 Tracking de facturación externa
        estadoFacturacion: estadoFacturacion as
          | "Pendiente"
          | "Facturado"
          | "Enviado",
        numeroFacturaExterna: numeroFacturaExterna || undefined,
        fechaFacturacion: fechaFacturacion || undefined,
        archivoFacturaPDF: archivoFacturaPDFData,
      });

      toast.success("Reporte actualizado exitosamente");
      setModalEditarReporte(false);
      setReporteSeleccionado(null);
    } catch (error) {
      toast.error("Error al actualizar el reporte");
    } finally {
      setGuardando(false);
    }
  };

  const exportarReportes = () => {
    const csvContent = [
      [
        "Fecha",
        "Cliente",
        "Equipo",
        "Descripción",
        "Componente",
        "Precio",
        "Comentarios",
      ].join(","),
      ...reportesFiltrados.map((reporte) =>
        [
          reporte.fecha,
          reporte.cliente,
          reporte.nombreEquipo,
          `"${reporte.descripcion}"`,
          reporte.componente?.nombre || "N/A",
          reporte.precioServicio || 0,
          `"${reporte.comentarios || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reportes_servicio_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Reportes exportados correctamente");
  };

  const confirmarEliminarReporte = (reporte: any) => {
    setReporteParaEliminar(reporte);
    setModalConfirmarEliminacion(true);
  };

  const eliminarReporte = async () => {
    if (!reporteParaEliminar) return;

    setEliminando(true);
    try {
      // 🔧 Devolver repuestos al stock antes de eliminar el reporte completamente
      if (
        reporteParaEliminar.repuestosUtilizados &&
        reporteParaEliminar.repuestosUtilizados.length > 0
      ) {
        const { devolverRepuestosAlStockReporte } = useAppStore.getState();

        for (const repuesto of reporteParaEliminar.repuestosUtilizados) {
          try {
            // 🎯 Usar la nueva función híbrida para devolución con trazabilidad completa
            await devolverRepuestosAlStockReporte({
              itemId: repuesto.id,
              productoNombre: repuesto.nombre,
              productoMarca: repuesto.marca,
              productoModelo: repuesto.modelo,
              cantidad: repuesto.cantidad,
              cantidadAnterior: repuesto.stockAntes - repuesto.cantidad, // Stock actual antes de devolver
              mantenimientoId: reporteParaEliminar.id,
              equipoId: reporteParaEliminar.equipoId,
              tecnicoResponsable: "Sistema",
              observaciones: `Devolución automática por eliminación de reporte - ${reporteParaEliminar.descripcion}`,
            });

            console.log(
              `✅ Repuesto devuelto al stock con trazabilidad completa: ${repuesto.nombre} (+${repuesto.cantidad})`
            );
          } catch (error) {
            console.error(
              `❌ Error devolviendo repuesto ${repuesto.nombre}:`,
              error
            );
          }
        }

        toast.success(
          `Repuestos devueltos al stock: ${reporteParaEliminar.repuestosUtilizados.length} items`,
          {
            description: "Stock actualizado con trazabilidad completa",
          }
        );
      }

      await deleteMantenimiento(reporteParaEliminar.id);
      toast.success("Reporte eliminado exitosamente");
      setModalConfirmarEliminacion(false);
      setReporteParaEliminar(null);
    } catch (error) {
      toast.error("Error al eliminar el reporte");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <DashboardLayout
      title="Gestión de Reportes"
      subtitle="Administra todos los reportes de servicio técnico generados"
    >
      <div className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reportes
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticas.totalReportes}
              </div>
              <p className="text-xs text-muted-foreground">
                Reportes generados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatearGuaranies(estadisticas.ingresosTotales)}
              </div>
              <p className="text-xs text-muted-foreground">
                Servicios facturados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Precio Promedio
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatearGuaranies(estadisticas.promedioServicio)}
              </div>
              <p className="text-xs text-muted-foreground">Por servicio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sin Precio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {estadisticas.reportesSinPrecio}
              </div>
              <p className="text-xs text-muted-foreground">
                Pendientes facturar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Acciones */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="busqueda">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="busqueda"
                    placeholder="Buscar por cliente, equipo, descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cliente">Cliente</Label>
                <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los clientes</SelectItem>
                    {clientesUnicos.map((cliente) => (
                      <SelectItem key={cliente} value={cliente}>
                        {cliente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fecha">Período</Label>
                <Select value={filtroFecha} onValueChange={setFiltroFecha}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los períodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los períodos</SelectItem>
                    <SelectItem value="hoy">Hoy</SelectItem>
                    <SelectItem value="7dias">Últimos 7 días</SelectItem>
                    <SelectItem value="30dias">Últimos 30 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={exportarReportes} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Reportes */}
        <Card>
          <CardHeader>
            <CardTitle>
              Reportes Generados ({reportesFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Fecha</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[120px]">Equipo</TableHead>
                    <TableHead className="min-w-[200px]">Descripción</TableHead>
                    <TableHead className="w-[100px]">Componente</TableHead>
                    <TableHead className="w-[120px]">Precio</TableHead>
                    <TableHead className="w-[130px]">Estado</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportesFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No hay reportes
                        </h3>
                        <p className="text-gray-600">
                          No se encontraron reportes que coincidan con los
                          filtros.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportesFiltrados.map((reporte) => (
                      <TableRow key={reporte.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {formatearFecha(reporte.fecha)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-sm">
                                {reporte.cliente}
                              </p>
                              <p className="text-xs text-gray-500">
                                {reporte.ubicacion}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">
                            {reporte.nombreEquipo}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p
                            className="text-sm max-w-xs truncate"
                            title={reporte.descripcion}
                          >
                            {reporte.descripcion}
                          </p>
                        </TableCell>
                        <TableCell>
                          {reporte.componente ? (
                            <Badge variant="outline" className="text-xs">
                              {reporte.componente.nombre}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              General
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {reporte.precioServicio ? (
                            <span className="font-medium text-green-600">
                              {formatearGuaranies(reporte.precioServicio)}
                            </span>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Sin precio
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const estado =
                              reporte.estadoFacturacion || "Pendiente";
                            const badgeProps = {
                              Pendiente: {
                                variant: "secondary" as const,
                                className: "bg-gray-100 text-gray-800",
                              },
                              Facturado: {
                                variant: "default" as const,
                                className: "bg-blue-100 text-blue-800",
                              },
                              Enviado: {
                                variant: "default" as const,
                                className: "bg-green-100 text-green-800",
                              },
                            };

                            return (
                              <div className="space-y-1">
                                <Badge
                                  {...badgeProps[
                                    estado as keyof typeof badgeProps
                                  ]}
                                  className="text-xs"
                                >
                                  {estado}
                                </Badge>
                                {reporte.numeroFacturaExterna && (
                                  <p className="text-xs text-gray-500">
                                    #{reporte.numeroFacturaExterna}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalEditar(reporte)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalVer(reporte)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalWhatsApp(reporte)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Enviar por WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                            {getCurrentUser()?.rol === "super_admin" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  confirmarEliminarReporte(reporte)
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Edición */}
        <Dialog open={modalEditarReporte} onOpenChange={setModalEditarReporte}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold">
                Editar Reporte
              </DialogTitle>
            </DialogHeader>

            {reporteSeleccionado && (
              <div className="space-y-6">
                {/* Información del Reporte */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {reporteSeleccionado.cliente}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Equipo:</span>{" "}
                    {reporteSeleccionado.nombreEquipo}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Código:</span>{" "}
                    {reporteSeleccionado.codigoMantenimiento || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reporteSeleccionado.descripcion}
                  </p>
                </div>

                {/* Campos de Edición */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="precio" className="text-sm font-medium">
                      Precio del Servicio (₲)
                    </Label>
                    <Input
                      id="precio"
                      type="number"
                      placeholder="120000"
                      value={precioEditado}
                      onChange={(e) => setPrecioEditado(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="comentarios"
                      className="text-sm font-medium"
                    >
                      Comentarios
                    </Label>
                    <Textarea
                      id="comentarios"
                      placeholder="Comentarios adicionales del servicio..."
                      value={comentariosEditados}
                      onChange={(e) => setComentariosEditados(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Sección de Tracking de Facturación Externa */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-base text-gray-900">
                      Tracking de Facturación Externa
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="estadoFacturacion"
                        className="text-sm font-medium"
                      >
                        Estado de Facturación
                      </Label>
                      <Select
                        value={estadoFacturacion}
                        onValueChange={setEstadoFacturacion}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Facturado">Facturado</SelectItem>
                          <SelectItem value="Enviado">
                            Enviado al Cliente
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {estadoFacturacion !== "Pendiente" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="numeroFactura"
                            className="text-sm font-medium"
                          >
                            Número de Factura
                          </Label>
                          <Input
                            id="numeroFactura"
                            placeholder="2025"
                            value={numeroFacturaExterna}
                            onChange={(e) =>
                              setNumeroFacturaExterna(e.target.value)
                            }
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="fechaFacturacion"
                            className="text-sm font-medium"
                          >
                            Fecha de Facturación
                          </Label>
                          <Input
                            id="fechaFacturacion"
                            type="date"
                            value={fechaFacturacion}
                            onChange={(e) =>
                              setFechaFacturacion(e.target.value)
                            }
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label
                            htmlFor="archivoFactura"
                            className="text-sm font-medium"
                          >
                            Adjuntar PDF de Factura
                          </Label>
                          <div className="space-y-2">
                            <Input
                              id="archivoFactura"
                              type="file"
                              accept=".pdf"
                              onChange={(e) =>
                                setArchivoFacturaPDF(
                                  e.target.files?.[0] || null
                                )
                              }
                              className="cursor-pointer h-10 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {archivoFacturaPDF && (
                              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-200">
                                <FileText className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700 font-medium">
                                  {archivoFacturaPDF.name}
                                </span>
                                <span className="text-xs text-green-600">
                                  ({(archivoFacturaPDF.size / 1024).toFixed(1)}{" "}
                                  KB)
                                </span>
                              </div>
                            )}
                            {reporteSeleccionado?.archivoFacturaPDF &&
                              !archivoFacturaPDF && (
                                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm text-blue-700">
                                    Archivo actual:{" "}
                                    {
                                      reporteSeleccionado.archivoFacturaPDF
                                        .nombre
                                    }
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setModalEditarReporte(false)}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={guardarCambiosReporte}
                    disabled={guardando}
                    className="px-6"
                  >
                    {guardando ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Visualización */}
        <Dialog open={modalVerReporte} onOpenChange={setModalVerReporte}>
          <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
              <DialogTitle className="text-lg font-semibold">
                Detalles del Reporte
              </DialogTitle>
            </DialogHeader>

            {reporteParaVer && (
              <div className="flex-1 px-4 py-3 overflow-y-auto">
                <div className="space-y-4">
                  {/* Fila 1: Información Principal */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Cliente */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold text-sm text-blue-900">
                          Cliente
                        </h3>
                      </div>
                      <p className="text-blue-800 font-medium text-sm">
                        {reporteParaVer.cliente}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {reporteParaVer.ubicacion}
                      </p>
                    </div>

                    {/* Fecha */}
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <h4 className="font-semibold text-sm text-gray-900">
                          Fecha del Servicio
                        </h4>
                      </div>
                      <p className="text-gray-800 text-sm">
                        {formatearFecha(reporteParaVer.fecha)}
                      </p>
                    </div>

                    {/* Precio */}
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <h4 className="font-semibold text-sm text-green-900">
                          Precio
                        </h4>
                      </div>
                      {reporteParaVer.precioServicio ? (
                        <p className="text-lg font-bold text-green-700">
                          {formatearGuaranies(reporteParaVer.precioServicio)}
                        </p>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Sin precio
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Fila 2: Equipo y Código */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Información del Equipo */}
                    <div className="p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-4 bg-slate-600 rounded"></div>
                        <h4 className="font-semibold text-sm text-slate-900">
                          Equipo
                        </h4>
                      </div>
                      <p className="font-medium text-slate-900 text-sm mb-1">
                        {reporteParaVer.nombreEquipo}
                      </p>
                      {reporteParaVer.componente && (
                        <Badge variant="outline" className="text-xs">
                          {reporteParaVer.componente.nombre}
                        </Badge>
                      )}
                    </div>

                    {/* Código */}
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <h4 className="font-semibold text-sm text-gray-900">
                          Código
                        </h4>
                      </div>
                      <p className="text-gray-800 font-mono text-sm">
                        {reporteParaVer.codigoMantenimiento || "No asignado"}
                      </p>
                    </div>
                  </div>

                  {/* Fila 3: Descripción */}
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <h4 className="font-semibold text-sm text-amber-900">
                        Descripción del Trabajo
                      </h4>
                    </div>
                    <p className="text-amber-800 text-sm leading-relaxed">
                      {reporteParaVer.descripcion}
                    </p>
                  </div>

                  {/* Fila 4: Comentarios (si existen) */}
                  {reporteParaVer.comentarios && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Edit className="h-4 w-4 text-purple-600" />
                        <h4 className="font-semibold text-sm text-purple-900">
                          Comentarios
                        </h4>
                      </div>
                      <p className="text-purple-800 text-sm leading-relaxed">
                        {reporteParaVer.comentarios}
                      </p>
                    </div>
                  )}

                  {/* 🔧 Fila 4.5: Repuestos Utilizados */}
                  {reporteParaVer.repuestosUtilizados &&
                    reporteParaVer.repuestosUtilizados.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <RepuestosViewer
                          repuestos={reporteParaVer.repuestosUtilizados}
                        />
                      </div>
                    )}

                  {/* Fila 5: Estado de Facturación */}
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <h4 className="font-semibold text-sm text-indigo-900">
                        Estado de Facturación
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-indigo-700 font-medium mb-1">
                          Estado:
                        </p>
                        {(() => {
                          const estado =
                            reporteParaVer.estadoFacturacion || "Pendiente";
                          const badgeProps = {
                            Pendiente: {
                              variant: "secondary" as const,
                              className: "bg-gray-100 text-gray-800",
                            },
                            Facturado: {
                              variant: "default" as const,
                              className: "bg-blue-100 text-blue-800",
                            },
                            Enviado: {
                              variant: "default" as const,
                              className: "bg-green-100 text-green-800",
                            },
                          };

                          return (
                            <Badge
                              {...badgeProps[estado as keyof typeof badgeProps]}
                              className="text-xs"
                            >
                              {estado}
                            </Badge>
                          );
                        })()}
                      </div>

                      {reporteParaVer.numeroFacturaExterna && (
                        <div>
                          <p className="text-xs text-indigo-700 font-medium mb-1">
                            Número:
                          </p>
                          <p className="font-mono text-indigo-800 text-sm">
                            #{reporteParaVer.numeroFacturaExterna}
                          </p>
                        </div>
                      )}

                      {reporteParaVer.fechaFacturacion && (
                        <div>
                          <p className="text-xs text-indigo-700 font-medium mb-1">
                            Fecha:
                          </p>
                          <p className="text-indigo-800 text-sm">
                            {formatearFecha(reporteParaVer.fechaFacturacion)}
                          </p>
                        </div>
                      )}

                      {reporteParaVer.archivoFacturaPDF && (
                        <div>
                          <p className="text-xs text-indigo-700 font-medium mb-1">
                            Archivo:
                          </p>
                          <div className="flex items-center gap-2 p-2 bg-white rounded border">
                            <FileText className="h-3 w-3 text-indigo-600" />
                            <span className="text-xs text-indigo-800 flex-1 truncate">
                              {reporteParaVer.archivoFacturaPDF.nombre}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  reporteParaVer.archivoFacturaPDF.url,
                                  "_blank"
                                )
                              }
                              className="h-6 px-2"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t flex justify-end flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setModalVerReporte(false)}
                className="px-6"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmación de Eliminación */}
        <Dialog
          open={modalConfirmarEliminacion}
          onOpenChange={setModalConfirmarEliminacion}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-red-600">
                Confirmar Eliminación
              </DialogTitle>
            </DialogHeader>

            {reporteParaEliminar && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">
                      ¿Estás seguro?
                    </h3>
                  </div>
                  <p className="text-red-800 text-sm mb-3">
                    Esta acción eliminará permanentemente el reporte y no se
                    puede deshacer.
                  </p>

                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-gray-900">
                      {reporteParaEliminar.cliente}
                    </p>
                    <p className="text-sm text-gray-600">
                      {reporteParaEliminar.nombreEquipo}
                    </p>
                    <p className="text-sm text-gray-600">
                      Fecha: {formatearFecha(reporteParaEliminar.fecha)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reporteParaEliminar.descripcion}
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-yellow-800 text-sm font-medium">
                      Advertencia
                    </p>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    El reporte se eliminará completamente del sistema,
                    incluyendo toda la información de facturación asociada.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setModalConfirmarEliminacion(false)}
                    disabled={eliminando}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={eliminarReporte}
                    disabled={eliminando}
                    className="px-6"
                  >
                    {eliminando ? "Eliminando..." : "Eliminar Reporte"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de WhatsApp */}
        <WhatsAppReportModal
          isOpen={modalWhatsApp}
          onClose={() => setModalWhatsApp(false)}
          mantenimiento={reporteParaWhatsApp}
          equipo={
            reporteParaWhatsApp
              ? equipos.find((e) => e.id === reporteParaWhatsApp.equipoId)
              : null
          }
          cliente={{
            nombre: reporteParaWhatsApp?.cliente || "",
            telefono: reporteParaWhatsApp?.telefono || "",
            contactoPrincipal: reporteParaWhatsApp?.contactoPrincipal || "",
          }}
        />
      </div>
    </DashboardLayout>
  );
}
