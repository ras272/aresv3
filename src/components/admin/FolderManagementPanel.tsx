"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Folder,
  FolderOpen,
  Move,
  Merge,
  Split,
  Trash2,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
} from "lucide-react";
import {
  folderManager,
  reorganizarProductos,
  renombrarCarpeta,
  fusionarCarpetas,
  dividirCarpeta,
  ejecutarLimpiezaCarpetas,
  generarReporteCarpetas,
  crearBackupEstructuraCarpetas,
  type FolderOperation,
  type FolderCleanupReport,
} from "@/lib/folder-management-utilities";
import { obtenerMetricasPerformance } from "@/lib/folder-performance";

// ===============================================
// INTERFACES
// ===============================================

interface FolderStats {
  resumen: {
    totalCarpetas: number;
    totalProductos: number;
    carpetasVacias: number;
    productosInconsistentes: number;
  };
  carpetasPorTipo: Record<string, number>;
  estadisticasDetalladas: any[];
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================

export default function FolderManagementPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [folderStats, setFolderStats] = useState<FolderStats | null>(null);
  const [cleanupReport, setCleanupReport] =
    useState<FolderCleanupReport | null>(null);
  const [activeOperations, setActiveOperations] = useState<FolderOperation[]>(
    []
  );
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Estados para operaciones
  const [moveOperation, setMoveOperation] = useState({
    productIds: "",
    targetFolder: "",
    newDestinationType: "",
  });

  const [renameOperation, setRenameOperation] = useState({
    currentPath: "",
    newPath: "",
  });

  const [mergeOperation, setMergeOperation] = useState({
    sourceFolders: "",
    targetFolder: "",
  });

  const [splitOperation, setSplitOperation] = useState({
    sourceFolder: "",
    criterion: "marca" as "marca" | "tipo" | "custom",
    customConfig: "",
  });

  // ===============================================
  // EFECTOS
  // ===============================================

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(updateActiveOperations, 2000);
    return () => clearInterval(interval);
  }, []);

  // ===============================================
  // FUNCIONES DE CARGA DE DATOS
  // ===============================================

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFolderStats(),
        updateActiveOperations(),
        loadPerformanceMetrics(),
      ]);
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolderStats = async () => {
    try {
      const stats = await generarReporteCarpetas();
      setFolderStats(stats);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const loadCleanupReport = async () => {
    try {
      setLoading(true);
      const report = await ejecutarLimpiezaCarpetas();
      setCleanupReport(report);
    } catch (error) {
      console.error("Error generando reporte de limpieza:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateActiveOperations = () => {
    const operations = folderManager.getActiveOperations();
    setActiveOperations(operations);
  };

  const loadPerformanceMetrics = async () => {
    try {
      const metrics = obtenerMetricasPerformance();
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error("Error cargando métricas:", error);
    }
  };

  // ===============================================
  // MANEJADORES DE OPERACIONES
  // ===============================================

  const handleMoveProducts = async () => {
    if (!moveOperation.productIds || !moveOperation.targetFolder) return;

    setLoading(true);
    try {
      const productIds = moveOperation.productIds
        .split(",")
        .map((id) => id.trim());
      const result = await reorganizarProductos(
        productIds,
        moveOperation.targetFolder,
        moveOperation.newDestinationType || undefined
      );

      if (result.success) {
        alert(`${result.movedCount} productos movidos exitosamente`);
        setMoveOperation({
          productIds: "",
          targetFolder: "",
          newDestinationType: "",
        });
        await loadFolderStats();
      } else {
        alert(`Error moviendo productos: ${result.errors.join(", ")}`);
      }
    } catch (error) {
      console.error("Error en operación de movimiento:", error);
      alert("Error ejecutando operación de movimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleRenameFolder = async () => {
    if (!renameOperation.currentPath || !renameOperation.newPath) return;

    setLoading(true);
    try {
      const result = await renombrarCarpeta(
        renameOperation.currentPath,
        renameOperation.newPath
      );

      if (result.success) {
        alert(
          `Carpeta renombrada exitosamente. ${result.affectedProducts} productos actualizados`
        );
        setRenameOperation({ currentPath: "", newPath: "" });
        await loadFolderStats();
      }
    } catch (error) {
      console.error("Error renombrando carpeta:", error);
      alert("Error renombrando carpeta");
    } finally {
      setLoading(false);
    }
  };

  const handleMergeFolders = async () => {
    if (!mergeOperation.sourceFolders || !mergeOperation.targetFolder) return;

    setLoading(true);
    try {
      const sourceFolders = mergeOperation.sourceFolders
        .split(",")
        .map((f) => f.trim());
      const result = await fusionarCarpetas(
        sourceFolders,
        mergeOperation.targetFolder
      );

      if (result.success) {
        alert(`${result.mergedProducts} productos fusionados exitosamente`);
        if (result.conflicts.length > 0) {
          console.warn("Conflictos encontrados:", result.conflicts);
        }
        setMergeOperation({ sourceFolders: "", targetFolder: "" });
        await loadFolderStats();
      }
    } catch (error) {
      console.error("Error fusionando carpetas:", error);
      alert("Error fusionando carpetas");
    } finally {
      setLoading(false);
    }
  };

  const handleSplitFolder = async () => {
    if (!splitOperation.sourceFolder) return;

    setLoading(true);
    try {
      const config = splitOperation.customConfig
        ? JSON.parse(splitOperation.customConfig)
        : undefined;

      const result = await dividirCarpeta(
        splitOperation.sourceFolder,
        splitOperation.criterion,
        config
      );

      if (result.success) {
        alert(
          `Carpeta dividida exitosamente. ${result.newFolders.length} nuevas carpetas creadas, ${result.movedProducts} productos movidos`
        );
        setSplitOperation({
          sourceFolder: "",
          criterion: "marca",
          customConfig: "",
        });
        await loadFolderStats();
      }
    } catch (error) {
      console.error("Error dividiendo carpeta:", error);
      alert("Error dividiendo carpeta");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const result = await crearBackupEstructuraCarpetas();
      if (result.success) {
        alert(
          `Backup creado exitosamente: ${result.backupId} (${result.recordCount} registros)`
        );
      }
    } catch (error) {
      console.error("Error creando backup:", error);
      alert("Error creando backup");
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // COMPONENTES DE RENDERIZADO
  // ===============================================

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Carpetas</p>
              <p className="text-2xl font-bold">
                {folderStats?.resumen.totalCarpetas || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold">
                {folderStats?.resumen.totalProductos || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Carpetas Vacías</p>
              <p className="text-2xl font-bold">
                {folderStats?.resumen.carpetasVacias || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Inconsistencias</p>
              <p className="text-2xl font-bold">
                {cleanupReport?.inconsistentProducts.length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOperations = () => (
    <div className="space-y-6">
      {/* Mover Productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="w-5 h-5" />
            Mover Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="productIds">
              IDs de Productos (separados por coma)
            </Label>
            <Input
              id="productIds"
              value={moveOperation.productIds}
              onChange={(e) =>
                setMoveOperation((prev) => ({
                  ...prev,
                  productIds: e.target.value,
                }))
              }
              placeholder="uuid1, uuid2, uuid3..."
            />
          </div>
          <div>
            <Label htmlFor="targetFolder">Carpeta Destino</Label>
            <Input
              id="targetFolder"
              value={moveOperation.targetFolder}
              onChange={(e) =>
                setMoveOperation((prev) => ({
                  ...prev,
                  targetFolder: e.target.value,
                }))
              }
              placeholder="Ares, Servicio Técnico/Classys..."
            />
          </div>
          <div>
            <Label htmlFor="newDestinationType">
              Nuevo Tipo de Destino (opcional)
            </Label>
            <Input
              id="newDestinationType"
              value={moveOperation.newDestinationType}
              onChange={(e) =>
                setMoveOperation((prev) => ({
                  ...prev,
                  newDestinationType: e.target.value,
                }))
              }
              placeholder="stock, cliente, reparacion"
            />
          </div>
          <Button onClick={handleMoveProducts} disabled={loading}>
            <Move className="w-4 h-4 mr-2" />
            Mover Productos
          </Button>
        </CardContent>
      </Card>

      {/* Renombrar Carpeta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Renombrar Carpeta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPath">Ruta Actual</Label>
            <Input
              id="currentPath"
              value={renameOperation.currentPath}
              onChange={(e) =>
                setRenameOperation((prev) => ({
                  ...prev,
                  currentPath: e.target.value,
                }))
              }
              placeholder="Ares, Servicio Técnico/Classys..."
            />
          </div>
          <div>
            <Label htmlFor="newPath">Nueva Ruta</Label>
            <Input
              id="newPath"
              value={renameOperation.newPath}
              onChange={(e) =>
                setRenameOperation((prev) => ({
                  ...prev,
                  newPath: e.target.value,
                }))
              }
              placeholder="Nueva ruta..."
            />
          </div>
          <Button onClick={handleRenameFolder} disabled={loading}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Renombrar Carpeta
          </Button>
        </CardContent>
      </Card>

      {/* Fusionar Carpetas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5" />
            Fusionar Carpetas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sourceFolders">
              Carpetas Origen (separadas por coma)
            </Label>
            <Input
              id="sourceFolders"
              value={mergeOperation.sourceFolders}
              onChange={(e) =>
                setMergeOperation((prev) => ({
                  ...prev,
                  sourceFolders: e.target.value,
                }))
              }
              placeholder="Carpeta1, Carpeta2, Carpeta3..."
            />
          </div>
          <div>
            <Label htmlFor="mergeTargetFolder">Carpeta Destino</Label>
            <Input
              id="mergeTargetFolder"
              value={mergeOperation.targetFolder}
              onChange={(e) =>
                setMergeOperation((prev) => ({
                  ...prev,
                  targetFolder: e.target.value,
                }))
              }
              placeholder="Carpeta destino..."
            />
          </div>
          <Button onClick={handleMergeFolders} disabled={loading}>
            <Merge className="w-4 h-4 mr-2" />
            Fusionar Carpetas
          </Button>
        </CardContent>
      </Card>

      {/* Dividir Carpeta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Split className="w-5 h-5" />
            Dividir Carpeta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sourceFolder">Carpeta a Dividir</Label>
            <Input
              id="sourceFolder"
              value={splitOperation.sourceFolder}
              onChange={(e) =>
                setSplitOperation((prev) => ({
                  ...prev,
                  sourceFolder: e.target.value,
                }))
              }
              placeholder="Carpeta a dividir..."
            />
          </div>
          <div>
            <Label htmlFor="criterion">Criterio de División</Label>
            <select
              id="criterion"
              value={splitOperation.criterion}
              onChange={(e) =>
                setSplitOperation((prev) => ({
                  ...prev,
                  criterion: e.target.value as any,
                }))
              }
              className="w-full p-2 border rounded"
            >
              <option value="marca">Por Marca</option>
              <option value="tipo">Por Tipo</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          {splitOperation.criterion === "custom" && (
            <div>
              <Label htmlFor="customConfig">
                Configuración Personalizada (JSON)
              </Label>
              <Input
                id="customConfig"
                value={splitOperation.customConfig}
                onChange={(e) =>
                  setSplitOperation((prev) => ({
                    ...prev,
                    customConfig: e.target.value,
                  }))
                }
                placeholder='{"porCantidad": true}'
              />
            </div>
          )}
          <Button onClick={handleSplitFolder} disabled={loading}>
            <Split className="w-4 h-4 mr-2" />
            Dividir Carpeta
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderCleanup = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Limpieza y Mantenimiento</h3>
        <Button onClick={loadCleanupReport} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Generar Reporte
        </Button>
      </div>

      {cleanupReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-yellow-600" />
                Carpetas Vacías ({cleanupReport.emptyFolders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cleanupReport.emptyFolders.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cleanupReport.emptyFolders.map((folder, index) => (
                    <Badge key={index} variant="outline">
                      {folder}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay carpetas vacías</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Productos Inconsistentes (
                {cleanupReport.inconsistentProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cleanupReport.inconsistentProducts.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cleanupReport.inconsistentProducts
                    .slice(0, 5)
                    .map((product, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{product.nombre}</p>
                        <p className="text-gray-500">{product.issue}</p>
                      </div>
                    ))}
                  {cleanupReport.inconsistentProducts.length > 5 && (
                    <p className="text-sm text-gray-500">
                      Y {cleanupReport.inconsistentProducts.length - 5} más...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No hay inconsistencias</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-orange-600" />
                Productos Huérfanos ({cleanupReport.orphanedProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cleanupReport.orphanedProducts.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cleanupReport.orphanedProducts
                    .slice(0, 5)
                    .map((product, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{product.nombre}</p>
                        <p className="text-gray-500">{product.issue}</p>
                      </div>
                    ))}
                  {cleanupReport.orphanedProducts.length > 5 && (
                    <p className="text-sm text-gray-500">
                      Y {cleanupReport.orphanedProducts.length - 5} más...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No hay productos huérfanos</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderActiveOperations = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Operaciones Activas</h3>
      {activeOperations.length > 0 ? (
        <div className="space-y-3">
          {activeOperations.map((operation) => (
            <Card key={operation.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{operation.type}</p>
                    <p className="text-sm text-gray-500">
                      {operation.affectedProducts.length} productos afectados
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        operation.status === "completed"
                          ? "default"
                          : operation.status === "failed"
                          ? "destructive"
                          : operation.status === "in_progress"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {operation.status}
                    </Badge>
                    {operation.status === "in_progress" && (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </div>
                {operation.status === "in_progress" && (
                  <Progress value={50} className="mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No hay operaciones activas</p>
      )}
    </div>
  );

  // ===============================================
  // RENDER PRINCIPAL
  // ===============================================

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Carpetas</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleCreateBackup}
            variant="outline"
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Crear Backup
          </Button>
          <Button
            onClick={loadInitialData}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {loading && (
        <Alert className="mb-4">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <AlertDescription>Cargando datos...</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="operations">Operaciones</TabsTrigger>
          <TabsTrigger value="cleanup">Limpieza</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
          {folderStats && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(folderStats.carpetasPorTipo).map(
                    ([tipo, cantidad]) => (
                      <div key={tipo} className="text-center">
                        <p className="text-2xl font-bold">{cantidad}</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {tipo}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="operations" className="mt-6">
          {renderOperations()}
        </TabsContent>

        <TabsContent value="cleanup" className="mt-6">
          {renderCleanup()}
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          {renderActiveOperations()}
          {performanceMetrics && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tamaño de Caché</p>
                    <p className="text-xl font-bold">
                      {performanceMetrics.cache.size}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hit Rate</p>
                    <p className="text-xl font-bold">
                      {performanceMetrics.queries.cacheHitRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tiempo Promedio</p>
                    <p className="text-xl font-bold">
                      {performanceMetrics.queries.averageTime.toFixed(0)}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Consultas</p>
                    <p className="text-xl font-bold">
                      {performanceMetrics.queries.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
