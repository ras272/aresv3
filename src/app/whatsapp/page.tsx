'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Smartphone, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  QrCode,
  Send,
  RefreshCw,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  obtenerEstadoWhatsApp, 
  inicializarWhatsApp, 
  enviarReporteWhatsApp,
  validarNumeroWhatsApp 
} from '@/lib/whatsapp';

export default function WhatsAppPage() {
  const [estadoWhatsApp, setEstadoWhatsApp] = useState<any>(null);
  const [cargandoEstado, setCargandoEstado] = useState(true);
  const [inicializando, setInicializando] = useState(false);
  
  // Estados para prueba de mensaje
  const [numeroTest, setNumeroTest] = useState('');
  const [mensajeTest, setMensajeTest] = useState('🔧 *Mensaje de Prueba - Ares Paraguay*\n\nEste es un mensaje de prueba del sistema de reportes automáticos.\n\n✅ Si recibes este mensaje, WhatsApp está funcionando correctamente.\n\n---\n*Ares Paraguay - Servicio Técnico*');
  const [enviandoTest, setEnviandoTest] = useState(false);

  useEffect(() => {
    cargarEstadoWhatsApp();
  }, []);

  const cargarEstadoWhatsApp = async () => {
    setCargandoEstado(true);
    try {
      const estado = await obtenerEstadoWhatsApp();
      setEstadoWhatsApp(estado);
    } catch (error) {
      console.error('Error obteniendo estado WhatsApp:', error);
      toast.error('Error obteniendo estado de WhatsApp');
    } finally {
      setCargandoEstado(false);
    }
  };

  const inicializar = async () => {
    setInicializando(true);
    try {
      const resultado = await inicializarWhatsApp();
      if (resultado.success) {
        toast.success(resultado.message);
        await cargarEstadoWhatsApp();
      } else {
        toast.error(resultado.message);
      }
    } catch (error) {
      toast.error('Error inicializando WhatsApp');
    } finally {
      setInicializando(false);
    }
  };

  const enviarMensajePrueba = async () => {
    const validacion = validarNumeroWhatsApp(numeroTest);
    if (!validacion.valido) {
      toast.error(validacion.error || 'Número inválido');
      return;
    }

    setEnviandoTest(true);
    try {
      // Simular datos de reporte para la prueba
      const datosTest = {
        mantenimiento: {
          id: 'test-001',
          fecha: new Date().toISOString(),
          descripcion: 'Mensaje de prueba del sistema',
          comentarios: 'Este es un mensaje de prueba para verificar la conectividad',
          estado: 'Finalizado' as const,
          precioServicio: 150000
        },
        equipo: {
          nombreEquipo: 'Equipo de Prueba',
          marca: 'Test',
          modelo: 'V1.0'
        },
        cliente: {
          nombre: 'Cliente de Prueba',
          telefono: validacion.numeroFormateado
        }
      };

      const resultado = await enviarReporteWhatsApp(datosTest);
      
      if (resultado.success) {
        toast.success('Mensaje de prueba enviado exitosamente');
        setNumeroTest('');
      } else {
        toast.error(`Error enviando mensaje: ${resultado.message}`);
      }
    } catch (error) {
      toast.error('Error enviando mensaje de prueba');
    } finally {
      setEnviandoTest(false);
    }
  };

  const renderEstadoConexion = () => {
    if (cargandoEstado) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-500">Verificando estado...</span>
        </div>
      );
    }

    if (!estadoWhatsApp) {
      return (
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-600">Error obteniendo estado</span>
        </div>
      );
    }

    if (estadoWhatsApp.conectado) {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Conectado</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Activo
            </Badge>
          </div>
          {estadoWhatsApp.numeroConectado && (
            <p className="text-xs text-gray-500 ml-6">
              {estadoWhatsApp.numeroConectado}
            </p>
          )}
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-600 font-medium">Desconectado</span>
            <Badge variant="destructive" className="text-xs">
              Inactivo
            </Badge>
          </div>
          {estadoWhatsApp.error && (
            <p className="text-xs text-red-500 ml-6">
              {estadoWhatsApp.error}
            </p>
          )}
        </div>
      );
    }
  };

  return (
    <DashboardLayout
      title="Configuración de WhatsApp"
      subtitle="Gestiona la conexión de WhatsApp para envío automático de reportes"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Estado de Conexión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              <span>Estado de Conexión</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderEstadoConexion()}
            
            <div className="flex space-x-3">
              <Button
                onClick={cargarEstadoWhatsApp}
                variant="outline"
                size="sm"
                disabled={cargandoEstado}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${cargandoEstado ? 'animate-spin' : ''}`} />
                Actualizar Estado
              </Button>
              
              {!estadoWhatsApp?.conectado && (
                <Button
                  onClick={inicializar}
                  size="sm"
                  disabled={inicializando}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {inicializando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Inicializando...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Conectar WhatsApp
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuración Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Modo:</span>
                <Badge variant={process.env.NODE_ENV === 'development' ? 'secondary' : 'default'}>
                  {process.env.NODE_ENV === 'development' ? 'Desarrollo' : 'Producción'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cliente ID:</span>
                <span className="font-mono text-xs">ares-whatsapp-client</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sesión:</span>
                <span className="text-xs">
                  {estadoWhatsApp?.sesionActiva ? 'Guardada' : 'No disponible'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Envío de reportes automático</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Validación de números paraguayos</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Mensajes personalizados</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Adjuntos PDF (futuro)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prueba de Mensaje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-blue-600" />
              <span>Enviar Mensaje de Prueba</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroTest">Número de WhatsApp</Label>
                <Input
                  id="numeroTest"
                  value={numeroTest}
                  onChange={(e) => setNumeroTest(e.target.value)}
                  placeholder="+595 XXX XXX XXX"
                  disabled={enviandoTest}
                />
                {numeroTest && (
                  <div className="mt-1">
                    {(() => {
                      const validacion = validarNumeroWhatsApp(numeroTest);
                      return validacion.valido ? (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">Número válido</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 text-red-600" />
                          <span className="text-xs text-red-600">{validacion.error}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={enviarMensajePrueba}
                  disabled={enviandoTest || !numeroTest || !estadoWhatsApp?.conectado}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {enviandoTest ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Prueba
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="mensajeTest">Vista Previa del Mensaje</Label>
              <Textarea
                id="mensajeTest"
                value={mensajeTest}
                onChange={(e) => setMensajeTest(e.target.value)}
                rows={8}
                className="font-mono text-sm bg-green-50 border-green-200"
                disabled={enviandoTest}
              />
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <span>Instrucciones de Configuración</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Para Desarrollo:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• El sistema simula envíos exitosos automáticamente</li>
                <li>• No se requiere configuración adicional</li>
                <li>• Perfecto para testing de la interfaz</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2">Para Producción:</h4>
              <ol className="text-sm text-orange-800 space-y-1">
                <li>1. Haz clic en "Conectar WhatsApp"</li>
                <li>2. Escanea el código QR con WhatsApp Web</li>
                <li>3. La sesión se guardará automáticamente</li>
                <li>4. Prueba el envío con un número real</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Uso en Reportes:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Ve a la página de Reportes</li>
                <li>• Haz clic en el botón verde de WhatsApp en cualquier reporte</li>
                <li>• Ingresa el número del cliente</li>
                <li>• El mensaje se genera automáticamente con los datos del reporte</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}