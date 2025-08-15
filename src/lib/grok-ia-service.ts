import { supabase } from './database/shared/supabase';

// Configuración de Groq API (más rápido que Grok)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_API_KEY = process.env.NEXT_PUBLIC_GROK_API_KEY || '';

interface MemoriaIA {
  id: string;
  tipoMemoria: 'conversacion' | 'aprendizaje' | 'contexto' | 'patron';
  contenido: any;
  palabrasClave: string[];
  relevancia: number;
  fechaCreacion: string;
  fechaUltimoAcceso: string;
  vecesAccedida: number;
  usuarioOrigen?: string;
  contextoOrigen?: string;
  activa: boolean;
}

interface ConversacionIA {
  id: string;
  sesionId: string;
  usuario?: string;
  consulta: string;
  respuesta: string;
  contextoUsado: any;
  satisfaccion?: number;
  fechaConsulta: string;
  duracionProcesamiento: number;
  tokensUsados: number;
  modeloUsado: string;
}

export class GrokIAService {
  private sesionId: string;
  private memoriaCache: MemoriaIA[] = [];
  
  constructor(sesionId?: string) {
    this.sesionId = sesionId || `sesion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cargar memoria relevante para el contexto
  async cargarMemoria(palabrasClave: string[] = [], limite: number = 20): Promise<MemoriaIA[]> {
    try {
      let query = supabase
        .from('ia_memoria')
        .select('*')
        .eq('activa', true)
        .order('relevancia', { ascending: false })
        .order('fecha_ultimo_acceso', { ascending: false })
        .limit(limite);

      if (palabrasClave.length > 0) {
        query = query.overlaps('palabras_clave', palabrasClave);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Actualizar el acceso a cada memoria cargada
      if (data && data.length > 0) {
        for (const memoria of data) {
          await this.actualizarAccesoMemoria(memoria.id);
        }
      }
      
      this.memoriaCache = data || [];
      return this.memoriaCache;
    } catch (error) {
      console.error('Error cargando memoria IA:', error);
      return [];
    }
  }

  // Actualizar acceso a memoria específica
  private async actualizarAccesoMemoria(memoriaId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('actualizar_acceso_memoria', {
        memoria_id: memoriaId
      });
      
      if (error) {
        // Si la función no existe, actualizar manualmente
        // Obtener el valor actual y actualizarlo manualmente
        const { data: memoriaActual } = await supabase
          .from('ia_memoria')
          .select('veces_accedida')
          .eq('id', memoriaId)
          .single();
          
        await supabase
          .from('ia_memoria')
          .update({
            fecha_ultimo_acceso: new Date().toISOString(),
            veces_accedida: (memoriaActual?.veces_accedida || 0) + 1
          })
          .eq('id', memoriaId);
      }
    } catch (error) {
      console.error('Error actualizando acceso a memoria:', error);
    }
  } 
 // Guardar nueva memoria
  async guardarMemoria(
    tipo: 'conversacion' | 'aprendizaje' | 'contexto' | 'patron',
    contenido: any,
    palabrasClave: string[],
    relevancia: number = 5,
    contextoOrigen?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ia_memoria')
        .insert({
          tipo_memoria: tipo,
          contenido: contenido,
          palabras_clave: palabrasClave,
          relevancia: relevancia,
          contexto_origen: contextoOrigen,
          activa: true
        });

      if (error) throw error;
      
      console.log('✅ Memoria guardada:', { tipo, palabrasClave, relevancia });
    } catch (error) {
      console.error('❌ Error guardando memoria:', error);
    }
  }

  // Extraer palabras clave de un texto
  private extraerPalabrasClave(texto: string): string[] {
    const palabrasComunes = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'como', 'pero', 'sus', 'me', 'ya', 'muy', 'sin', 'sobre', 'ser', 'tiene', 'todo', 'esta', 'fue', 'han', 'hay', 'donde', 'más', 'qué', 'cómo', 'cuál', 'cuándo', 'dónde'];
    
    return texto
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(palabra => palabra.length > 2 && !palabrasComunes.includes(palabra))
      .slice(0, 10); // Máximo 10 palabras clave
  }

  // Construir contexto completo para Grok
  async construirContexto(consulta: string, datosAres: any): Promise<string> {
    const palabrasClave = this.extraerPalabrasClave(consulta);
    const memoriaRelevante = await this.cargarMemoria(palabrasClave, 15);
    
    let contexto = `# CARTUCHERO IA - SISTEMA ARES
    
Eres el Cartuchero IA, un asistente especializado en cartuchos HIFU para equipos Classys (Ultraformer MPT y Ultraformer III).

## DATOS ACTUALES DEL SISTEMA:
${JSON.stringify(datosAres, null, 2)}

## MEMORIA PREVIA RELEVANTE:
${memoriaRelevante.map(m => `
- Tipo: ${m.tipoMemoria}
- Contenido: ${JSON.stringify(m.contenido)}
- Palabras clave: ${m.palabrasClave.join(', ')}
- Relevancia: ${m.relevancia}/10
- Accedida: ${m.vecesAccedida} veces
`).join('\n')}

## INSTRUCCIONES:
1. Responde SIEMPRE en español
2. Usa emojis para hacer las respuestas más amigables
3. Si preguntan "¿te acuerdas de...?" busca en tu memoria previa
4. Sé específico con números de serie, fechas y datos técnicos
5. Si no tienes información, dilo claramente
6. Aprende de cada interacción para futuras consultas

## ESPECIALIDADES:
- Trazabilidad completa de cartuchos HIFU
- Estados: Disponible, En Uso, Con Error, Standby, Agotado, Vencido
- Historial de remisiones y movimientos
- Problemas comunes y soluciones
- Estadísticas y análisis de uso

Consulta del usuario: "${consulta}"`;

    return contexto;
  }

  // Procesar consulta con Grok
  async procesarConsulta(consulta: string, datosAres: any, usuario?: string): Promise<string> {
    const inicioTiempo = Date.now();
    
    try {
      // Construir contexto completo
      const contextoCompleto = await this.construirContexto(consulta, datosAres);
      
      // Intentar primero con Groq (más rápido y confiable)
      let response;
      let modeloUsado = 'groq-llama-3.1-8b-instant';
      
      if (GROQ_API_KEY) {
        console.log('🚀 Usando Groq API (Llama 3.1)...');
        response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant', // Modelo actual y rápido de Groq
            messages: [
              {
                role: 'system',
                content: contextoCompleto
              },
              {
                role: 'user',
                content: consulta
              }
            ],
            temperature: 0.7,
            max_tokens: 1500,
            stream: false
          })
        });
      } else if (GROK_API_KEY) {
        console.log('🤖 Fallback a Grok API...');
        modeloUsado = 'grok-beta';
        response = await fetch(GROK_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROK_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [
              {
                role: 'system',
                content: contextoCompleto
              },
              {
                role: 'user',
                content: consulta
              }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            stream: false
          })
        });
      } else {
        throw new Error('No hay API keys configuradas para IA');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ Grok API no disponible (${response.status}): ${errorText}`);
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const respuesta = data.choices[0]?.message?.content || 'No pude procesar tu consulta.';
      const tokensUsados = data.usage?.total_tokens || 0;
      
      const duracionProcesamiento = Date.now() - inicioTiempo;

      // Guardar conversación
      await this.guardarConversacion(consulta, respuesta, datosAres, duracionProcesamiento, tokensUsados, usuario, modeloUsado);
      
      // Guardar memoria de la consulta
      await this.guardarMemoria(
        'conversacion',
        { consulta, respuesta, contexto: 'cartuchos_hifu' },
        this.extraerPalabrasClave(consulta + ' ' + respuesta),
        7, // Relevancia alta para conversaciones
        'grok_consulta'
      );

      // Aprender patrones si es necesario
      await this.aprenderPatrones(consulta, respuesta);

      return respuesta;
      
    } catch (error) {
      console.error('❌ Error procesando consulta con Grok:', error);
      
      // Fallback al sistema local si Grok falla
      return await this.fallbackSistemaLocal(consulta, datosAres);
    }
  }

  // Guardar conversación completa
  private async guardarConversacion(
    consulta: string,
    respuesta: string,
    contextoUsado: any,
    duracion: number,
    tokens: number,
    usuario?: string,
    modeloUsado: string = 'groq-llama-3.1-8b-instant'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ia_conversaciones')
        .insert({
          sesion_id: this.sesionId,
          usuario: usuario,
          consulta: consulta,
          respuesta: respuesta,
          contexto_usado: contextoUsado,
          duracion_procesamiento: duracion,
          tokens_usados: tokens,
          modelo_usado: modeloUsado
        });

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error guardando conversación:', error);
    }
  }

  // Aprender patrones automáticamente
  private async aprenderPatrones(consulta: string, respuesta: string): Promise<void> {
    try {
      const consultaLower = consulta.toLowerCase();
      
      // Detectar tipos de consultas frecuentes
      let tipoPatron = '';
      let descripcion = '';
      
      if (consultaLower.includes('serie') && consultaLower.includes('quién')) {
        tipoPatron = 'consulta_trazabilidad';
        descripcion = 'Usuario pregunta sobre el historial/propietario de un cartucho específico';
      } else if (consultaLower.includes('standby') || consultaLower.includes('error')) {
        tipoPatron = 'consulta_problemas';
        descripcion = 'Usuario pregunta sobre cartuchos con problemas o en standby';
      } else if (consultaLower.includes('cuántos') || consultaLower.includes('disponible')) {
        tipoPatron = 'consulta_inventario';
        descripcion = 'Usuario pregunta sobre disponibilidad de cartuchos';
      } else if (consultaLower.includes('acuerdas') || consultaLower.includes('recuerdas')) {
        tipoPatron = 'consulta_memoria';
        descripcion = 'Usuario pregunta sobre información previa o memoria';
      }

      if (tipoPatron) {
        // Verificar si el patrón ya existe
        const { data: patronExistente } = await supabase
          .from('ia_patrones_aprendidos')
          .select('*')
          .eq('patron_tipo', tipoPatron)
          .single();

        if (patronExistente) {
          // Actualizar patrón existente
          await supabase
            .from('ia_patrones_aprendidos')
            .update({
              frecuencia: patronExistente.frecuencia + 1,
              fecha_ultima_actualizacion: new Date().toISOString(),
              ejemplos: {
                ...patronExistente.ejemplos,
                [`ejemplo_${Date.now()}`]: { consulta, respuesta }
              }
            })
            .eq('id', patronExistente.id);
        } else {
          // Crear nuevo patrón
          await supabase
            .from('ia_patrones_aprendidos')
            .insert({
              patron_tipo: tipoPatron,
              patron_descripcion: descripcion,
              frecuencia: 1,
              ejemplos: {
                [`ejemplo_${Date.now()}`]: { consulta, respuesta }
              }
            });
        }
      }
    } catch (error) {
      console.error('❌ Error aprendiendo patrones:', error);
    }
  }

  // Sistema de fallback local si Grok falla
  private async fallbackSistemaLocal(consulta: string, datosAres: any): Promise<string> {
    const consultaLower = consulta.toLowerCase();
    
    // Obtener cartuchos HIFU
    const cartuchos = datosAres.cartuchos || [];
    
    // Consultas sobre número de serie específico
    if (consultaLower.includes('serie') && consultaLower.match(/[a-z0-9-]+/)) {
      const numeroSerie = consulta.match(/[A-Z0-9-]+/)?.[0];
      if (numeroSerie) {
        const cartucho = cartuchos.find((c: any) => 
          c.numeroSerie?.includes(numeroSerie) || 
          c.id.includes(numeroSerie)
        );
        
        if (cartucho) {
          let respuesta = `📋 **Cartucho ${numeroSerie}** (Sistema Local):\n\n`;
          respuesta += `• **Estado actual**: ${cartucho.estado}\n`;
          respuesta += `• **Marca**: ${cartucho.marca}\n`;
          respuesta += `• **Cantidad disponible**: ${cartucho.cantidadDisponible}\n`;
          respuesta += `• **Fecha de ingreso**: ${new Date(cartucho.fechaIngreso).toLocaleDateString()}\n`;
          
          if (cartucho.equipoPadre) {
            respuesta += `• **Cliente actual**: ${cartucho.equipoPadre.cliente}\n`;
            respuesta += `• **Equipo**: ${cartucho.equipoPadre.nombreEquipo}\n`;
          }
          
          if (cartucho.observaciones) {
            respuesta += `\n⚠️ **Observaciones**: ${cartucho.observaciones}\n`;
          }
          
          respuesta += `\n💡 *Para obtener respuestas más detalladas, configura tu API key de Grok.*`;
          return respuesta;
        } else {
          return `❌ No encontré ningún cartucho con el número de serie "${numeroSerie}". ¿Podrías verificar el número?`;
        }
      }
    }

    // Consultas sobre estado
    if (consultaLower.includes('standby') || consultaLower.includes('espera')) {
      const cartuchosStandby = cartuchos.filter((c: any) => 
        c.estado === 'En reparación' || 
        c.observaciones?.toLowerCase().includes('standby') ||
        c.observaciones?.toLowerCase().includes('error')
      );
      
      if (cartuchosStandby.length > 0) {
        let respuesta = `⏸️ **Cartuchos en Standby/Con Error** (${cartuchosStandby.length}) - Sistema Local:\n\n`;
        cartuchosStandby.forEach((c: any) => {
          respuesta += `• **${c.numeroSerie || c.id.slice(0, 8)}** - ${c.marca}\n`;
          respuesta += `  Estado: ${c.estado}\n`;
          if (c.observaciones) {
            respuesta += `  Problema: ${c.observaciones}\n`;
          }
          respuesta += `  Desde: ${new Date(c.createdAt).toLocaleDateString()}\n\n`;
        });
        respuesta += `💡 *Para análisis más profundo, configura tu API key de Grok.*`;
        return respuesta;
      } else {
        return `✅ ¡Excelente! No hay cartuchos en standby actualmente. (Sistema Local)`;
      }
    }

    // Consultas sobre disponibilidad por profundidad
    const profundidadMatch = consultaLower.match(/(\d+\.?\d*)\s*mm/);
    if (profundidadMatch) {
      const profundidad = profundidadMatch[1] + 'mm';
      const cartuchosProfundidad = cartuchos.filter((c: any) => 
        c.nombre.includes(profundidad) && c.cantidadDisponible > 0
      );
      
      return `🎯 **Cartuchos ${profundidad} disponibles**: ${cartuchosProfundidad.length} (Sistema Local)\n\n` +
        cartuchosProfundidad.map((c: any) => 
          `• ${c.numeroSerie || 'SIN-SERIE'} - ${c.marca} (${c.cantidadDisponible} unidades)`
        ).join('\n') +
        `\n\n💡 *Para información más detallada, configura tu API key de Grok.*`;
    }

    // Estadísticas generales
    if (consultaLower.includes('estadística') || consultaLower.includes('resumen') || consultaLower.includes('total')) {
      const disponibles = cartuchos.filter((c: any) => c.cantidadDisponible > 0).length;
      const enUso = cartuchos.filter((c: any) => c.equipoPadre).length;
      const conError = cartuchos.filter((c: any) => c.estado === 'En reparación').length;
      
      return `📊 **Resumen de Cartuchos HIFU** (Sistema Local):\n\n` +
        `• **Total**: ${cartuchos.length} cartuchos\n` +
        `• **Disponibles**: ${disponibles}\n` +
        `• **En uso**: ${enUso}\n` +
        `• **Con error/standby**: ${conError}\n\n` +
        `🏭 **Por marca**:\n` +
        `• Classys: ${cartuchos.filter((c: any) => c.marca.toLowerCase() === 'classys').length}\n` +
        `• Otras: ${cartuchos.filter((c: any) => c.marca.toLowerCase() !== 'classys').length}\n\n` +
        `💡 *Para análisis más avanzado y memoria persistente, configura tu API key de Grok.*`;
    }

    // Consultas de memoria
    if (consultaLower.includes('acuerdas') || consultaLower.includes('recuerdas')) {
      // Buscar en memoria local
      const memoriaRelevante = await this.cargarMemoria(this.extraerPalabrasClave(consulta), 5);
      if (memoriaRelevante.length > 0) {
        let respuesta = `🧠 **Sí, recuerdo algunas cosas relacionadas** (Sistema Local):\n\n`;
        memoriaRelevante.forEach(m => {
          respuesta += `• **${m.tipoMemoria}**: ${JSON.stringify(m.contenido).substring(0, 100)}...\n`;
          respuesta += `  Relevancia: ${m.relevancia}/10, Accedida: ${m.vecesAccedida} veces\n\n`;
        });
        respuesta += `💡 *Con Grok configurado, tendría acceso a memoria más avanzada y conversacional.*`;
        return respuesta;
      } else {
        return `🤔 No tengo recuerdos específicos sobre eso en mi memoria local. Con Grok configurado, podría recordar más detalles de nuestras conversaciones.`;
      }
    }

    // Respuesta por defecto con sugerencias
    return `🤖 **Sistema Local Activo** - Grok no configurado\n\n` +
      `Puedo ayudarte con:\n\n` +
      `• **Buscar por serie**: "¿De quién era el cartucho serie CL-UF3-2024-001?"\n` +
      `• **Estado standby**: "¿Qué cartuchos están en standby?"\n` +
      `• **Por profundidad**: "¿Cuántos cartuchos 4.5mm tenemos?"\n` +
      `• **Estadísticas**: "Dame un resumen de cartuchos"\n` +
      `• **Memoria**: "¿Te acuerdas de...?"\n\n` +
      `💡 **Para activar Grok IA completa**:\n` +
      `1. Obtén tu API key en https://console.x.ai/\n` +
      `2. Configúrala en las variables de entorno\n` +
      `3. Disfruta de respuestas conversacionales avanzadas\n\n` +
      `¿Podrías reformular tu pregunta usando alguno de los ejemplos de arriba?`;
  }

  // Obtener estadísticas de uso de la IA
  async obtenerEstadisticas(): Promise<any> {
    try {
      const { data: conversaciones } = await supabase
        .from('ia_conversaciones')
        .select('*')
        .order('fecha_consulta', { ascending: false });

      const { data: patrones } = await supabase
        .from('ia_patrones_aprendidos')
        .select('*')
        .order('frecuencia', { ascending: false });

      const { data: memoria } = await supabase
        .from('ia_memoria')
        .select('*')
        .eq('activa', true);

      return {
        totalConsultas: conversaciones?.length || 0,
        consultasHoy: conversaciones?.filter(c => 
          new Date(c.fecha_consulta).toDateString() === new Date().toDateString()
        ).length || 0,
        patronesAprendidos: patrones?.length || 0,
        memoriaTotal: memoria?.length || 0,
        tokensUsados: conversaciones?.reduce((sum, c) => sum + (c.tokens_usados || 0), 0) || 0,
        patronMasFrecuente: patrones?.[0] || null
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }
}