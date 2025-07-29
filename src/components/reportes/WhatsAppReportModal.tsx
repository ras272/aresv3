"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageCircle,
  Phone,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Smartphone,
} from "lucide-react";
import { AresLoader } from "@/components/ui/ares-loader";
import { toast } from "sonner";
import {
  enviarReporteWhatsApp,
  validarNumeroWhatsApp,
  obtenerEstadoWhatsApp,
} from "@/lib/whatsapp";
import { PDFReporteService } from "@/lib/pdf-service";
import { Mantenimiento } from "@/types";

interface WhatsAppReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mantenimiento: Mantenimiento | null;
  equipo: any;
  cliente: {
    nombre: string;
    telefono?: string;
    contactoPrincipal?: string;
  };
}

export function WhatsAppReportModal({
  isOpen,
  onClose,
  mantenimiento,
  equipo,
  cliente,
}: WhatsAppReportModalProps) {
  const [telefono, setTelefono] = useState("");
  const [mensajePersonalizado, setMensajePersonalizado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [estadoWhatsApp, setEstadoWhatsApp] = useState<any>(null);
  const [validacionTelefono, setValidacionTelefono] = useState<any>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [reportePDF, setReportePDF] = useState<Blob | null>(null);

  // Cargar estado de WhatsApp al abrir modal
  useEffect(() => {
    if (isOpen) {
      cargarEstadoWhatsApp();
      setTelefono(cliente.telefono || "");
      setMensajePersonalizado("");
      setReportePDF(null);
      // Generar PDF automáticamente al abrir
      generarPDFReporte();
    }
  }, [isOpen, cliente.telefono]);

  // Validar teléfono en tiempo real
  useEffect(() => {
    if (telefono) {
      const validacion = validarNumeroWhatsApp(telefono);
      setValidacionTelefono(validacion);
    } else {
      setValidacionTelefono(null);
    }
  }, [telefono]);

  const cargarEstadoWhatsApp = async () => {
    try {
      const estado = await obtenerEstadoWhatsApp();
      setEstadoWhatsApp(estado);
    } catch (error) {
      console.error("Error obteniendo estado WhatsApp:", error);
    }
  };

  const generarPDFReporte = async () => {
    if (!mantenimiento || !equipo) return;

    setGenerandoPDF(true);
    try {
      console.log("📄 Generando PDF del reporte en el servidor...");

      // Llamar a la API route para generar el PDF en el servidor
      const response = await fetch("/api/reportes/generar-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mantenimiento,
          equipo,
          cliente,
        }),
      });

      const resultado = await response.json();

      if (!response.ok || !resultado.success) {
        throw new Error(
          resultado.error || "Error generando PDF en el servidor"
        );
      }

      // Convertir el base64 de vuelta a Blob para compatibilidad
      const binaryString = atob(resultado.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pdfBlob = new Blob([bytes], { type: "application/pdf" });

      setReportePDF(pdfBlob);
      console.log("✅ PDF del reporte generado exitosamente en el servidor");
    } catch (error) {
      console.error("❌ Error generando PDF del reporte:", error);
      toast.error("Error generando PDF del reporte");
    } finally {
      setGenerandoPDF(false);
    }
  };

  const handleEnviarReporte = async () => {
    if (!mantenimiento || !equipo) {
      toast.error("Datos del reporte incompletos");
      return;
    }

    if (!validacionTelefono?.valido) {
      toast.error("Número de teléfono inválido");
      return;
    }

    if (!reportePDF) {
      toast.error(
        "El PDF del reporte aún se está generando. Espera un momento."
      );
      return;
    }

    setEnviando(true);

    try {
      // Preparar archivos adjuntos
      const attachments = [];

      // 1. PDF del Reporte (siempre se incluye) - Generar directamente en el servidor
      console.log("📄 Generando PDF del reporte directamente para WhatsApp...");

      const pdfResponse = await fetch("/api/reportes/generar-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mantenimiento,
          equipo,
          cliente,
        }),
      });

      const pdfResult = await pdfResponse.json();

      if (pdfResponse.ok && pdfResult.success) {
        attachments.push({
          filename: pdfResult.filename,
          data: pdfResult.data, // Ya viene en base64 del servidor
          mimetype: pdfResult.mimetype,
        });
        console.log("✅ PDF del reporte preparado para WhatsApp");
      } else {
        throw new Error("Error generando PDF para WhatsApp");
      }

      // 2. PDF de la Factura (si existe)
      if (mantenimiento.archivoFacturaPDF) {
        console.log('📄 Procesando factura PDF para WhatsApp...');
        
        // Priorizar el archivo directo si existe (para archivos recién adjuntados)
        if (mantenimiento.archivoFacturaPDF.file) {
          try {
            console.log('📄 Procesando factura PDF desde archivo directo...');
            
            const facturaBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(",")[1];
                resolve(base64);
              };
              reader.onerror = () => reject(new Error('Error leyendo archivo'));
              reader.readAsDataURL(mantenimiento.archivoFacturaPDF.file);
            });

            attachments.push({
              filename: mantenimiento.archivoFacturaPDF.nombre,
              data: facturaBase64,
              mimetype: "application/pdf",
            });
            
            console.log('✅ Factura PDF desde archivo directo preparada para WhatsApp');
          } catch (facturaError) {
            console.error('❌ Error procesando factura PDF desde archivo:', facturaError);
            console.log('⚠️ Continuando sin factura PDF...');
          }
        } else if (mantenimiento.archivoFacturaPDF.url) {
          try {
            console.log('📄 Procesando factura PDF - URL:', mantenimiento.archivoFacturaPDF.url.substring(0, 50) + '...');
            
            // Verificar si es una URL de blob temporal o una URL HTTP
            if (mantenimiento.archivoFacturaPDF.url.startsWith('blob:')) {
              console.log('⚠️ URL de blob temporal detectada, no se puede procesar desde el modal');
              console.log('⚠️ Continuando sin factura PDF...');
            } else {
              // Procesar URLs HTTP normales
              const facturaResponse = await fetch(mantenimiento.archivoFacturaPDF.url);
              
              if (!facturaResponse.ok) {
                throw new Error(`Error descargando factura: ${facturaResponse.status}`);
              }
              
              const facturaBlob = await facturaResponse.blob();
              console.log('📄 Factura blob obtenido:', {
                size: facturaBlob.size,
                type: facturaBlob.type
              });
              
              // Convertir blob a base64
              const facturaBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  const base64 = result.split(",")[1];
                  resolve(base64);
                };
                reader.onerror = () => reject(new Error('Error leyendo archivo'));
                reader.readAsDataURL(facturaBlob);
              });

              console.log('📄 Factura convertida a base64:', {
                filename: mantenimiento.archivoFacturaPDF.nombre,
                base64Length: facturaBase64.length
              });

              attachments.push({
                filename: mantenimiento.archivoFacturaPDF.nombre,
                data: facturaBase64,
                mimetype: "application/pdf",
              });
              
              console.log('✅ Factura PDF preparada para WhatsApp');
            }
          } catch (facturaError) {
            console.error('❌ Error procesando factura PDF:', facturaError);
            console.log('⚠️ Continuando sin factura PDF...');
            // No mostrar toast error, solo continuar sin la factura
          }
        } else {
          console.log('⚠️ Factura PDF sin URL ni archivo, omitiendo');
        }
      }

      console.log(`📎 Enviando ${attachments.length} archivo(s) adjunto(s):`);
      attachments.forEach((att, index) => {
        console.log(
          `  ${index + 1}. ${att.filename} (${att.mimetype}) - ${
            att.data.length
          } chars base64`
        );
      });

      const resultado = await enviarReporteWhatsApp({
        mantenimiento: {
          ...mantenimiento,
          // Agregar mensaje personalizado si existe
          comentarios: mensajePersonalizado
            ? `${
                mantenimiento.comentarios || ""
              }\n\n${mensajePersonalizado}`.trim()
            : mantenimiento.comentarios,
        },
        equipo,
        cliente: {
          ...cliente,
          telefono: validacionTelefono.numeroFormateado,
        },
        // Incluir archivos adjuntos
        attachments,
      });

      if (resultado.success) {
        toast.success(
          `Reporte enviado por WhatsApp exitosamente con ${attachments.length} archivo(s) adjunto(s)`
        );
        onClose();
      } else {
        toast.error(`Error enviando reporte: ${resultado.message}`);
      }
    } catch (error) {
      console.error("Error enviando reporte WhatsApp:", error);
      toast.error("Error inesperado enviando reporte");
    } finally {
      setEnviando(false);
    }
  };

  const generarVistaPrevia = () => {
    if (!mantenimiento || !equipo) return "";

    const fecha = new Date(mantenimiento.fecha).toLocaleDateString("es-PY");
    const precio = mantenimiento.precioServicio
      ? `₲ ${mantenimiento.precioServicio.toLocaleString("es-PY")}`
      : "No especificado";

    // Contar archivos adjuntos
    const numArchivos =
      (reportePDF ? 1 : 0) + (mantenimiento.archivoFacturaPDF ? 1 : 0);
    const archivosInfo = [];
    if (reportePDF) archivosInfo.push("📄 Reporte Técnico (PDF)");
    if (mantenimiento.archivoFacturaPDF) archivosInfo.push("🧾 Factura (PDF)");

    return `🔧 *REPORTE DE SERVICIO TÉCNICO*

📋 *Detalles del Servicio:*
• Cliente: ${cliente.nombre}
• Equipo: ${equipo.nombreEquipo}
• Marca: ${equipo.marca}
• Modelo: ${equipo.modelo}
• Fecha: ${fecha}

🔍 *Descripción del Trabajo:*
${mantenimiento.descripcion}

${
  mantenimiento.comentarios
    ? `💬 *Comentarios Técnicos:*
${mantenimiento.comentarios}

`
    : ""
}💰 *Precio del Servicio:* ${precio}

📄 *Estado:* ${mantenimiento.estado}

${
  mensajePersonalizado
    ? `📝 *Mensaje Adicional:*
${mensajePersonalizado}

`
    : ""
}${
      numArchivos > 0
        ? `📎 *Archivos Adjuntos (${numArchivos}):*
${archivosInfo.join("\n")}

`
        : ""
    }---
*Ares Paraguay - Servicio Técnico Especializado*
¿Consultas? Responde a este mensaje.`;
  };

  if (!mantenimiento || !equipo) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span>Enviar Reporte por WhatsApp</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel Izquierdo - Configuración */}
          <div className="space-y-4">
            {/* Estado de WhatsApp */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Estado de WhatsApp</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {estadoWhatsApp ? (
                  <div className="flex items-center space-x-2">
                    {estadoWhatsApp.conectado ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          Conectado
                        </span>
                        {estadoWhatsApp.numeroConectado && (
                          <Badge variant="outline" className="text-xs">
                            {estadoWhatsApp.numeroConectado}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">
                          {estadoWhatsApp.error || "Desconectado"}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AresLoader size="sm" />
                    <span className="text-sm text-gray-500">
                      Verificando estado...
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Información del Cliente</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Cliente</Label>
                  <p className="font-medium">{cliente.nombre}</p>
                </div>

                <div>
                  <Label htmlFor="telefono">Número de WhatsApp *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="telefono"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+595 XXX XXX XXX"
                      className="pl-10"
                    />
                  </div>
                  {validacionTelefono && (
                    <div className="mt-1 flex items-center space-x-1">
                      {validacionTelefono.valido ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">
                            Número válido
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-red-600" />
                          <span className="text-xs text-red-600">
                            {validacionTelefono.error}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {cliente.contactoPrincipal && (
                  <div>
                    <Label className="text-xs text-gray-500">
                      Contacto Principal
                    </Label>
                    <p className="text-sm">{cliente.contactoPrincipal}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mensaje Personalizado */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Mensaje Adicional (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={mensajePersonalizado}
                  onChange={(e) => setMensajePersonalizado(e.target.value)}
                  placeholder="Agregar mensaje personalizado al reporte..."
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Panel Derecho - Vista Previa */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Vista Previa del Mensaje</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-green-800">
                    {generarVistaPrevia()}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Archivos Adjuntos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Archivos Adjuntos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* PDF del Reporte */}
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Reporte Técnico
                      </p>
                      <p className="text-xs text-blue-600">
                        PDF generado automáticamente
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {generandoPDF ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : reportePDF ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>

                {/* PDF de la Factura */}
                {mantenimiento.archivoFacturaPDF ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Factura
                        </p>
                        <p className="text-xs text-green-600">
                          {mantenimiento.archivoFacturaPDF.nombre}
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Factura
                        </p>
                        <p className="text-xs text-gray-500">No adjuntada</p>
                      </div>
                    </div>
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  {reportePDF && mantenimiento.archivoFacturaPDF
                    ? "✅ Se enviarán 2 archivos adjuntos"
                    : reportePDF
                    ? "📄 Se enviará 1 archivo adjunto (reporte)"
                    : "⚠️ Generando archivos..."}
                </div>
              </CardContent>
            </Card>

            {/* Información del Reporte */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Detalles del Reporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Equipo:</span>
                  <span className="font-medium">{equipo.nombreEquipo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estado:</span>
                  <Badge
                    variant={
                      mantenimiento.estado === "Finalizado"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {mantenimiento.estado}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Precio:</span>
                  <span className="font-medium">
                    {mantenimiento.precioServicio
                      ? `₲ ${mantenimiento.precioServicio.toLocaleString(
                          "es-PY"
                        )}`
                      : "No especificado"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            onClick={handleEnviarReporte}
            disabled={enviando || !validacionTelefono?.valido || generandoPDF}
            className="bg-green-600 hover:bg-green-700"
          >
            {enviando ? (
              <>
                <AresLoader size="sm" className="mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar por WhatsApp
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
