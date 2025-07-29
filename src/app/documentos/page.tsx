'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Upload, Calendar, Package, ChevronLeft, ChevronRight, X, Download, Folder, FolderOpen, ArrowLeft } from 'lucide-react';
import { CargaMercaderia, DocumentoCarga } from '@/types';
import { uploadToCloudinary, getFileUrl } from '@/lib/cloudinary';

export default function DocumentosPage() {
  const {
    cargasMercaderia,
    documentosCarga,
    loadAllData,
    addDocumentoCarga,
    deleteDocumentoCarga,
    getDocumentosByCarga
  } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCarga, setSelectedCarga] = useState<CargaMercaderia | null>(null);
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const documentosRef = useRef<HTMLDivElement>(null);
  const [previewDocument, setPreviewDocument] = useState<DocumentoCarga | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Obtener todas las marcas únicas de las cargas (excluyendo las de tipo 'reparacion')
  const cargasValidas = cargasMercaderia.filter(carga => carga.tipoCarga !== 'reparacion');

  const marcasUnicas = Array.from(new Set(
    cargasValidas.flatMap(carga =>
      carga.productos.map(producto => producto.marca)
    )
  )).sort();

  // Agrupar cargas por marca
  const cargasPorMarca = marcasUnicas.reduce((acc, marca) => {
    const cargasDeMarca = cargasValidas.filter(carga =>
      carga.productos.some(producto => producto.marca === marca)
    );
    acc[marca] = cargasDeMarca;
    return acc;
  }, {} as Record<string, CargaMercaderia[]>);

  // Filtrar según si estamos viendo carpetas o cargas específicas
  let itemsToShow: any[] = [];
  let isShowingFolders = !selectedMarca;

  if (isShowingFolders) {
    // Mostrar carpetas de marcas
    itemsToShow = marcasUnicas.filter(marca =>
      marca.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } else {
    // Mostrar cargas de la marca seleccionada
    const cargasDeMarca = cargasPorMarca[selectedMarca] || [];
    itemsToShow = cargasDeMarca.filter(carga => {
      const codigoMostrar = carga.numeroCargaPersonalizado || carga.codigoCarga;
      return codigoMostrar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carga.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carga.fechaIngreso.includes(searchTerm);
    });
  }

  // Paginación
  const totalPages = Math.ceil(itemsToShow.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const itemsPaginados = itemsToShow.slice(startIndex, startIndex + itemsPerPage);

  // Reset página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Obtener documentos de la carga seleccionada
  const documentosSeleccionados = selectedCarga ? getDocumentosByCarga(selectedCarga.id) : [];

  // Función para seleccionar carga y hacer auto-scroll
  const handleSelectCarga = (carga: CargaMercaderia) => {
    setSelectedCarga(carga);
    // Auto-scroll al panel de documentos
    setTimeout(() => {
      documentosRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  // Función para manejar subida de archivos con Cloudinary
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCarga || !event.target.files) return;

    const files = Array.from(event.target.files);
    setUploading(true);

    try {
      for (const file of files) {


        // Subir archivo a Cloudinary
        const cloudinaryResult = await uploadToCloudinary(
          file,
          selectedCarga.codigoCarga,
          'Documento' // Tipo por defecto
        );

        // Crear documento con URL de Cloudinary
        const documento = {
          cargaId: selectedCarga.id,
          codigoCarga: selectedCarga.codigoCarga,
          nombre: file.name,
          tipoDocumento: 'Otro' as const,
          archivo: {
            nombre: file.name,
            tamaño: file.size,
            tipo: file.type,
            url: cloudinaryResult.secureUrl // URL permanente de Cloudinary
          },
          observaciones: `Subido a Cloudinary: ${cloudinaryResult.publicId}`,
          fechaSubida: new Date().toISOString(),
          subidoPor: 'Usuario Actual'
        };

        await addDocumentoCarga(documento);
      }

      // Limpiar input
      event.target.value = '';
    } catch (error) {
      console.error('❌ Error subiendo archivos:', error);
      alert('Error subiendo archivos. Verifica tu configuración de Cloudinary.');
    } finally {
      setUploading(false);
    }
  };

  // Función para eliminar documento
  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocumentoCarga(documentId);
    } catch (error) {
      console.error('Error eliminando documento:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión Documental</h1>
            <p className="text-muted-foreground">
              {selectedMarca ? `Documentos de ${selectedMarca}` : 'Organiza documentos por carpetas de marcas'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedMarca && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedMarca(null);
                  setSelectedCarga(null);
                  setCurrentPage(1);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Marcas
              </Button>
            )}
            <Badge variant="outline" className="text-sm">
              {selectedMarca ? `${cargasPorMarca[selectedMarca]?.length || 0} cargas` : `${marcasUnicas.length} marcas`}
            </Badge>
          </div>
        </div>

        {/* Buscador */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={isShowingFolders ? "Buscar marcas..." : "Buscar por código de carga, destino o fecha..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Marcas/Cargas */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isShowingFolders ? <Folder className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                  {isShowingFolders ? 'Carpetas por Marca' : `Cargas de ${selectedMarca}`}
                </div>
                {totalPages > 1 && (
                  <Badge variant="outline" className="text-xs">
                    Página {currentPage} de {totalPages}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Lista con altura fija */}
              <div className="space-y-3 min-h-[400px] max-h-[400px] overflow-y-auto">
                {itemsToShow.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {isShowingFolders ? <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" /> : <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />}
                    <p>{isShowingFolders ? 'No se encontraron marcas' : 'No se encontraron cargas'}</p>
                  </div>
                ) : (
                  itemsPaginados.map((item) => (
                    isShowingFolders ? (
                      // Mostrar carpetas de marcas
                      <div
                        key={item}
                        className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/50"
                        onClick={() => {
                          setSelectedMarca(item);
                          setSelectedCarga(null);
                          setCurrentPage(1);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <FolderOpen className="h-6 w-6 text-blue-500" />
                            <h3 className="font-semibold text-lg">{item}</h3>
                          </div>
                          <Badge variant="secondary">
                            {cargasPorMarca[item]?.length || 0} cargas
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground ml-9">
                          <p>Carpeta de documentos para productos {item}</p>
                        </div>
                      </div>
                    ) : (
                      // Mostrar cargas de la marca seleccionada
                      <div
                        key={item.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedCarga?.id === item.id ? 'border-primary bg-primary/5' : ''
                          }`}
                        onClick={() => handleSelectCarga(item)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{item.numeroCargaPersonalizado || item.codigoCarga}</h3>
                          <Badge variant="secondary">
                            {item.productos.length} productos
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(item.fechaIngreso).toLocaleDateString('es-ES')}
                          </div>
                          <p className="truncate">{item.destino}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {selectedMarca}
                            </Badge>
                            {item.productos.filter(p => p.marca === selectedMarca).length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {item.productos.filter(p => p.marca === selectedMarca).length} productos {selectedMarca}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  ))
                )}
              </div>

              {/* Controles de Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, itemsToShow.length)} de {itemsToShow.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Panel de Documentos */}
          <Card ref={documentosRef}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
                {selectedCarga && (
                  <Badge variant="outline" className="ml-2">
                    {selectedCarga.numeroCargaPersonalizado || selectedCarga.codigoCarga}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedCarga ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona una carga para ver sus documentos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Área de Subida de Documentos */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">Subir Documentos</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Facturas Paraguay Box, DHL, comprobantes, fotos, etc.
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Subiendo...' : 'Seleccionar Archivos'}
                    </Button>
                  </div>

                  {/* Lista de Documentos */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">
                      Documentos Asociados
                      {documentosSeleccionados.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {documentosSeleccionados.length}
                        </Badge>
                      )}
                    </h4>
                    {documentosSeleccionados.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                        No hay documentos subidos aún
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {documentosSeleccionados.map((documento) => (
                          <div key={documento.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{documento.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  {documento.tipoDocumento} • {(documento.archivo.tamaño / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPreviewDocument(documento);
                                  setShowPreview(true);
                                }}
                              >
                                Ver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(documento.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Vista Previa - Bonito como el original */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-background border rounded-lg shadow-lg max-w-4xl max-h-[90vh] w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 pb-2 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h2 className="text-lg font-semibold">{previewDocument?.nombre}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (previewDocument) {
                      window.open(previewDocument.archivo.url, '_blank');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {previewDocument && (
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  {previewDocument.archivo.tipo.startsWith('image/') ? (
                    // Vista previa de imágenes
                    <img
                      src={previewDocument.archivo.url}
                      alt={previewDocument.nombre}
                      className="w-full h-auto max-h-[70vh] object-contain"
                    />
                  ) : previewDocument.archivo.tipo === 'application/pdf' ? (
                    // Vista previa simplificada para PDFs
                    <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8">
                      <FileText className="h-16 w-16 text-blue-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Documento PDF</h3>
                      <p className="text-muted-foreground mb-2 font-medium">
                        {previewDocument.nombre}
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Tamaño: {(previewDocument.archivo.tamaño / 1024).toFixed(1)} KB
                      </p>

                      <div className="space-y-3 w-full max-w-sm">
                        <Button
                          className="w-full"
                          onClick={() => {
                            // Extraer publicId de las observaciones
                            let publicId = null;
                            if (previewDocument.observaciones?.includes('Cloudinary:')) {
                              publicId = previewDocument.observaciones.split('Cloudinary: ')[1];
                            }

                            // Usar URL optimizada para visualización
                            const viewUrl = publicId
                              ? getFileUrl(publicId, false) // false = para visualización
                              : previewDocument.archivo.url;


                            window.open(viewUrl, '_blank');
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Abrir PDF
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            // Extraer publicId de las observaciones
                            let publicId = null;
                            if (previewDocument.observaciones?.includes('Cloudinary:')) {
                              publicId = previewDocument.observaciones.split('Cloudinary: ')[1];
                            }

                            // Usar URL optimizada para descarga
                            const downloadUrl = publicId
                              ? getFileUrl(publicId, true) // true = para descarga
                              : previewDocument.archivo.url;



                            // Forzar descarga
                            const link = document.createElement('a');
                            link.href = downloadUrl;
                            link.download = previewDocument.nombre;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar PDF
                        </Button>

                        <div className="text-xs text-muted-foreground mt-4 p-3 bg-blue-50 rounded-lg">
                          💡 <strong>Tip:</strong> Si "Abrir PDF" no funciona, usa "Descargar PDF" para guardar el archivo.
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Para otros tipos de archivo
                    <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{previewDocument.nombre}</h3>
                      <p className="text-muted-foreground mb-4">
                        Vista previa no disponible para este tipo de archivo
                      </p>
                      <Button
                        onClick={() => window.open(previewDocument.archivo.url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar archivo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}