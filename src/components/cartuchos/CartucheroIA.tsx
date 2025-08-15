'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { Bot, Send, User, Loader2, Zap, Package, Activity, Brain, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GrokIAService } from '@/lib/grok-ia-service';

interface Mensaje {
  id: string;
  tipo: 'usuario' | 'ia';
  contenido: string;
  timestamp: Date;
  datos?: any; // Para mostrar datos estructurados
}

interface CartucheroIAProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartucheroIA({ isOpen, onClose }: CartucheroIAProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [grokService, setGrokService] = useState<GrokIAService | null>(null);
  const [estadisticasIA, setEstadisticasIA] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    componentesDisponibles, 
    remisiones, 
    movimientosStock, 
    equipos,
    loadAllData 
  } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      
      // Inicializar servicio de Grok
      const service = new GrokIAService();
      setGrokService(service);
      
      // Cargar estadísticas de la IA
      service.obtenerEstadisticas().then(stats => {
        setEstadisticasIA(stats);
      });
      
      // Mensaje de bienvenida (solo una vez al abrir)
      setMensajes([{
        id: '1',
        tipo: 'ia',
        contenido: '🤖 ¡Hola! Soy el Cartuchero IA con Groq y memoria persistente. Puedo recordar nuestras conversaciones anteriores. ¿Qué necesitas saber?',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, loadAllData]); // Removido estadisticasIA de las dependencias

  // Efecto separado para actualizar el mensaje de bienvenida con estadísticas (solo si no hay otros mensajes)
  useEffect(() => {
    if (estadisticasIA && mensajes.length === 1 && mensajes[0].id === '1') {
      const mensajeBienvenidaActualizado = `🧠 ¡Hola! Soy el Cartuchero IA con Groq. Tengo ${estadisticasIA.memoriaTotal} recuerdos y he aprendido ${estadisticasIA.patronesAprendidos} patrones. ¿En qué puedo ayudarte?`;
      
      setMensajes([{
        id: '1',
        tipo: 'ia',
        contenido: mensajeBienvenidaActualizado,
        timestamp: new Date()
      }]);
    }
  }, [estadisticasIA]); // Solo actualiza el mensaje de bienvenida si es necesario

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const procesarConsulta = async (consulta: string): Promise<string> => {
    const consultaLower = consulta.toLowerCase();
    
    // Obtener cartuchos HIFU
    const cartuchos = componentesDisponibles.filter(comp => 
      comp.nombre.toLowerCase().includes('cartucho') ||
      comp.tipoComponente.toLowerCase().includes('cartucho') ||
      comp.marca.toLowerCase() === 'classys'
    );

    // Consultas sobre número de serie específico
    if (consultaLower.includes('serie') && consultaLower.match(/[a-z0-9-]+/)) {
      const numeroSerie = consulta.match(/[A-Z0-9-]+/)?.[0];
      if (numeroSerie) {
        const cartucho = cartuchos.find(c => 
          c.numeroSerie?.includes(numeroSerie) || 
          c.id.includes(numeroSerie)
        );
        
        if (cartucho) {
          // Buscar en remisiones
          const remisionesCartucho = remisiones.filter(r => 
            r.productos.some(p => p.numeroSerie?.includes(numeroSerie))
          );
          
          // Buscar en movimientos
          const movimientos = movimientosStock.filter(m => 
            m.productoNombre.toLowerCase().includes('cartucho') &&
            (m.observaciones?.includes(numeroSerie) || false)
          );

          let respuesta = `📋 **Cartucho ${numeroSerie}**:\n\n`;
          respuesta += `• **Estado actual**: ${cartucho.estado}\n`;
          respuesta += `• **Marca**: ${cartucho.marca}\n`;
          respuesta += `• **Cantidad disponible**: ${cartucho.cantidadDisponible}\n`;
          respuesta += `• **Fecha de ingreso**: ${new Date(cartucho.fechaIngreso).toLocaleDateString()}\n`;
          
          if (cartucho.equipoPadre) {
            respuesta += `• **Cliente actual**: ${cartucho.equipoPadre.cliente}\n`;
            respuesta += `• **Equipo**: ${cartucho.equipoPadre.nombreEquipo}\n`;
          }
          
          if (remisionesCartucho.length > 0) {
            respuesta += `\n📦 **Historial de remisiones**:\n`;
            remisionesCartucho.slice(0, 3).forEach(r => {
              respuesta += `• ${r.numeroRemision} - ${r.cliente} (${new Date(r.fecha).toLocaleDateString()})\n`;
            });
          }
          
          if (cartucho.observaciones) {
            respuesta += `\n⚠️ **Observaciones**: ${cartucho.observaciones}\n`;
          }
          
          return respuesta;
        } else {
          return `❌ No encontré ningún cartucho con el número de serie "${numeroSerie}". ¿Podrías verificar el número?`;
        }
      }
    }

    // Consultas sobre estado
    if (consultaLower.includes('standby') || consultaLower.includes('espera')) {
      const cartuchosStandby = cartuchos.filter(c => 
        c.estado === 'En reparación' || 
        c.observaciones?.toLowerCase().includes('standby') ||
        c.observaciones?.toLowerCase().includes('error')
      );
      
      if (cartuchosStandby.length > 0) {
        let respuesta = `⏸️ **Cartuchos en Standby/Con Error** (${cartuchosStandby.length}):\n\n`;
        cartuchosStandby.forEach(c => {
          respuesta += `• **${c.numeroSerie || c.id.slice(0, 8)}** - ${c.marca}\n`;
          respuesta += `  Estado: ${c.estado}\n`;
          if (c.observaciones) {
            respuesta += `  Problema: ${c.observaciones}\n`;
          }
          respuesta += `  Desde: ${new Date(c.createdAt).toLocaleDateString()}\n\n`;
        });
        return respuesta;
      } else {
        return `✅ ¡Excelente! No hay cartuchos en standby actualmente.`;
      }
    }

    // Consultas sobre disponibilidad por profundidad
    const profundidadMatch = consultaLower.match(/(\d+\.?\d*)\s*mm/);
    if (profundidadMatch) {
      const profundidad = profundidadMatch[1] + 'mm';
      const cartuchosProfundidad = cartuchos.filter(c => 
        c.nombre.includes(profundidad) && c.cantidadDisponible > 0
      );
      
      return `🎯 **Cartuchos ${profundidad} disponibles**: ${cartuchosProfundidad.length}\n\n` +
        cartuchosProfundidad.map(c => 
          `• ${c.numeroSerie || 'SIN-SERIE'} - ${c.marca} (${c.cantidadDisponible} unidades)`
        ).join('\n');
    }

    // Consultas sobre cliente específico
    const clienteMatch = consultaLower.match(/cliente\s+(.+?)(?:\s|$)/);
    if (clienteMatch || consultaLower.includes('hospital') || consultaLower.includes('clínica')) {
      const clienteNombre = clienteMatch?.[1] || consulta.split(' ').find(word => 
        word.toLowerCase().includes('hospital') || word.toLowerCase().includes('clínica')
      );
      
      if (clienteNombre) {
        const cartuchosCliente = cartuchos.filter(c => 
          c.equipoPadre?.cliente.toLowerCase().includes(clienteNombre.toLowerCase())
        );
        
        if (cartuchosCliente.length > 0) {
          let respuesta = `🏥 **Cartuchos del cliente "${clienteNombre}"** (${cartuchosCliente.length}):\n\n`;
          cartuchosCliente.forEach(c => {
            respuesta += `• **${c.numeroSerie || 'SIN-SERIE'}** - ${c.marca}\n`;
            respuesta += `  Estado: ${c.estado}\n`;
            respuesta += `  Equipo: ${c.equipoPadre?.nombreEquipo}\n\n`;
          });
          return respuesta;
        } else {
          return `❌ No encontré cartuchos asignados al cliente "${clienteNombre}".`;
        }
      }
    }

    // Estadísticas generales
    if (consultaLower.includes('estadística') || consultaLower.includes('resumen') || consultaLower.includes('total')) {
      const disponibles = cartuchos.filter(c => c.cantidadDisponible > 0).length;
      const enUso = cartuchos.filter(c => c.equipoPadre).length;
      const conError = cartuchos.filter(c => c.estado === 'En reparación').length;
      
      return `📊 **Resumen de Cartuchos HIFU**:\n\n` +
        `• **Total**: ${cartuchos.length} cartuchos\n` +
        `• **Disponibles**: ${disponibles}\n` +
        `• **En uso**: ${enUso}\n` +
        `• **Con error/standby**: ${conError}\n\n` +
        `🏭 **Por marca**:\n` +
        `• Classys: ${cartuchos.filter(c => c.marca.toLowerCase() === 'classys').length}\n` +
        `• Otras: ${cartuchos.filter(c => c.marca.toLowerCase() !== 'classys').length}`;
    }

    // Respuesta por defecto con sugerencias
    return `🤔 No entendí completamente tu consulta. Puedo ayudarte con:\n\n` +
      `• **Buscar por serie**: "¿De quién era el cartucho serie CL-UF3-2024-001?"\n` +
      `• **Estado standby**: "¿Qué cartuchos están en standby?"\n` +
      `• **Por profundidad**: "¿Cuántos cartuchos 4.5mm tenemos?"\n` +
      `• **Por cliente**: "¿Qué cartuchos tiene el Hospital Central?"\n` +
      `• **Estadísticas**: "Dame un resumen de cartuchos"\n\n` +
      `¿Podrías reformular tu pregunta?`;
  };

  const enviarMensaje = async () => {
    if (!inputValue.trim() || isLoading || !grokService) return;

    const mensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      tipo: 'usuario',
      contenido: inputValue,
      timestamp: new Date()
    };

    setMensajes(prev => [...prev, mensajeUsuario]);
    const consultaOriginal = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Preparar datos completos para Grok
      const datosCompletos = {
        cartuchos: componentesDisponibles.filter(comp => 
          comp.nombre.toLowerCase().includes('cartucho') ||
          comp.tipoComponente.toLowerCase().includes('cartucho') ||
          comp.marca.toLowerCase() === 'classys'
        ),
        equipos: equipos,
        remisiones: remisiones,
        movimientosStock: movimientosStock,
        timestamp: new Date().toISOString()
      };

      // Usar Grok con memoria persistente
      const respuesta = await grokService.procesarConsulta(
        consultaOriginal, 
        datosCompletos, 
        'usuario_cartuchero' // ID del usuario
      );
      
      const mensajeIA: Mensaje = {
        id: (Date.now() + 1).toString(),
        tipo: 'ia',
        contenido: respuesta,
        timestamp: new Date()
      };

      setMensajes(prev => [...prev, mensajeIA]);

      // Actualizar estadísticas después de cada consulta
      const nuevasStats = await grokService.obtenerEstadisticas();
      setEstadisticasIA(nuevasStats);
      
    } catch (error) {
      console.error('❌ Error en consulta a Grok:', error);
      
      // Fallback al sistema local si Grok falla
      try {
        const respuestaFallback = await procesarConsulta(consultaOriginal);
        const mensajeIA: Mensaje = {
          id: (Date.now() + 1).toString(),
          tipo: 'ia',
          contenido: `${respuestaFallback}\n\n⚠️ (Respuesta desde sistema local - Grok no disponible)`,
          timestamp: new Date()
        };
        setMensajes(prev => [...prev, mensajeIA]);
      } catch (fallbackError) {
        const mensajeError: Mensaje = {
          id: (Date.now() + 1).toString(),
          tipo: 'ia',
          contenido: '❌ Error procesando tu consulta. Verifica tu conexión y configuración de API.',
          timestamp: new Date()
        };
        setMensajes(prev => [...prev, mensajeError]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl max-h-[80vh] flex flex-col"
      >
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-purple-500" />
                <span>Cartuchero IA</span>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Groq + Memoria
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {estadisticasIA && (
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Brain className="h-3 w-3" />
                      <span>{estadisticasIA.memoriaTotal} recuerdos</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{estadisticasIA.patronesAprendidos} patrones</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3" />
                      <span>{estadisticasIA.consultasHoy} hoy</span>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            {/* Indicador de estado de Groq */}
            <div className="flex items-center space-x-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${grokService ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {grokService ? '🚀 Groq IA conectado (Llama 3.1)' : '⚠️ IA desconectada - usando sistema local'}
              </span>
              {estadisticasIA?.tokensUsados && (
                <span className="text-xs text-gray-400">
                  • {estadisticasIA.tokensUsados.toLocaleString()} tokens usados
                </span>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
              <AnimatePresence>
                {mensajes.map((mensaje) => (
                  <motion.div
                    key={mensaje.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${mensaje.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      mensaje.tipo === 'usuario' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="flex items-start space-x-2">
                        {mensaje.tipo === 'ia' && (
                          <Bot className="h-4 w-4 mt-0.5 text-purple-500" />
                        )}
                        {mensaje.tipo === 'usuario' && (
                          <User className="h-4 w-4 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="whitespace-pre-line text-sm">
                            {mensaje.contenido}
                          </div>
                          <div className={`text-xs mt-1 ${
                            mensaje.tipo === 'usuario' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {mensaje.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-purple-500" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">Analizando cartuchos...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input de mensaje */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pregúntame sobre cartuchos HIFU..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={enviarMensaje}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Sugerencias rápidas */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "¿Qué cartuchos están en standby?",
                  "Dame un resumen de cartuchos",
                  "¿Cuántos cartuchos 4.5mm tenemos?"
                ].map((sugerencia) => (
                  <Button
                    key={sugerencia}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(sugerencia)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    {sugerencia}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}