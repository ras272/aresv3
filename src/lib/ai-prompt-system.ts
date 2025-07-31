import { ARES_KNOWLEDGE_BASE, REPORTES_EJEMPLO } from './ai-knowledge-base';

/**
 * 🤖 SISTEMA DE PROMPTS INTELIGENTES PARA GROK
 * Genera prompts contextualizados para reportes técnicos profesionales
 */

export interface ReporteContext {
  equipo: {
    nombre: string;
    numeroSerie: string;
    cliente: string;
    ubicacion: string;
    horasOperacion?: number;
  };
  mantenimiento: {
    tipo: 'preventivo' | 'correctivo' | 'instalacion';
    descripcion: string;
    observaciones?: string;
    tecnico: string;
  };
  inputUsuario: string; // Lo que escribió el técnico
}

export class AresAIPromptSystem {
  
  /**
   * 🎯 Genera prompt contextualizado para Grok
   */
  static generarPromptProfesional(context: ReporteContext): string {
    const equipoInfo = this.obtenerInfoEquipo(context.equipo.nombre);
    const plantilla = this.obtenerPlantilla(context.mantenimiento.tipo);
    const ejemploSimilar = this.obtenerEjemploSimilar(context.mantenimiento.tipo, context.equipo.nombre);

    return `
Eres un ingeniero técnico especializado de Ares Paraguay con 15+ años de experiencia en equipos médicos estéticos. 

**CONTEXTO DE LA EMPRESA:**
- ${ARES_KNOWLEDGE_BASE.empresa.nombre}: ${ARES_KNOWLEDGE_BASE.empresa.especialidad}
- Certificaciones: ${ARES_KNOWLEDGE_BASE.empresa.certificaciones.join(', ')}
- Cobertura: ${ARES_KNOWLEDGE_BASE.empresa.cobertura}

**INFORMACIÓN DEL EQUIPO:**
- Equipo: ${context.equipo.nombre} - Serie: ${context.equipo.numeroSerie}
- Cliente: ${context.equipo.cliente}
- Ubicación: ${context.equipo.ubicacion}
${context.equipo.horasOperacion ? `- Horas de operación: ${context.equipo.horasOperacion}` : ''}

**DATOS TÉCNICOS DEL EQUIPO:**
${equipoInfo ? `
- Fabricante: ${equipoInfo.fabricante}
- Tipo: ${equipoInfo.tipo}
- Aplicaciones: ${equipoInfo.aplicaciones.join(', ')}
- Componentes críticos: ${equipoInfo.componentes_criticos.join(', ')}
- Mantenimiento recomendado: ${equipoInfo.mantenimiento_preventivo}
- Problemas comunes: ${equipoInfo.problemas_comunes.join(', ')}
` : ''}

**TIPO DE SERVICIO:** ${context.mantenimiento.tipo.toUpperCase()}

**ESTRUCTURA REQUERIDA:**
${plantilla.estructura.map((item, index) => `${index + 1}. ${item}`).join('\n')}

**TERMINOLOGÍA TÉCNICA A USAR:**
- Diagnóstico: ${ARES_KNOWLEDGE_BASE.terminologia.diagnostico.slice(0, 3).join(', ')}
- Procedimientos: ${ARES_KNOWLEDGE_BASE.terminologia.procedimientos.slice(0, 3).join(', ')}
- Herramientas: ${ARES_KNOWLEDGE_BASE.terminologia.herramientas.slice(0, 3).join(', ')}

**RECOMENDACIONES ESTÁNDAR:**
${ARES_KNOWLEDGE_BASE.recomendaciones.generales.slice(0, 3).map(rec => `- ${rec}`).join('\n')}

**EJEMPLO DE REFERENCIA:**
${ejemploSimilar ? ejemploSimilar.substring(0, 800) + '...' : 'No hay ejemplo específico disponible'}

**INPUT DEL TÉCNICO:**
"${context.inputUsuario}"

**INSTRUCCIONES:**
1. Toma el input básico del técnico y expándelo a un reporte técnico profesional
2. Usa terminología técnica apropiada pero comprensible
3. Incluye detalles técnicos específicos del equipo
4. Mantén el tono profesional de Ares Paraguay
5. Incluye recomendaciones específicas
6. Agrega garantía y próximos pasos
7. El reporte debe ser entre 300-500 palabras
8. Usa formato markdown para mejor presentación
9. Incluye mediciones técnicas realistas cuando sea apropiado
10. Concluye con: "${plantilla.conclusion_tipo}"

**FORMATO DE SALIDA:**
Genera un reporte técnico completo en markdown que un cliente profesional esperaría recibir de Ares Paraguay.
`;
  }

  /**
   * 🔍 Obtiene información específica del equipo
   */
  private static obtenerInfoEquipo(nombreEquipo: string) {
    // Buscar coincidencia parcial en la base de conocimiento
    const equipoKey = Object.keys(ARES_KNOWLEDGE_BASE.equipos).find(key => 
      nombreEquipo.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(nombreEquipo.toLowerCase())
    );
    
    return equipoKey ? ARES_KNOWLEDGE_BASE.equipos[equipoKey as keyof typeof ARES_KNOWLEDGE_BASE.equipos] : null;
  }

  /**
   * 📋 Obtiene plantilla según tipo de servicio
   */
  private static obtenerPlantilla(tipo: string) {
    const tipoKey = tipo === 'preventivo' ? 'mantenimiento_preventivo' : 
                   tipo === 'correctivo' ? 'reparacion_correctiva' : 'instalacion';
    
    return ARES_KNOWLEDGE_BASE.plantillas[tipoKey as keyof typeof ARES_KNOWLEDGE_BASE.plantillas];
  }

  /**
   * 📝 Obtiene ejemplo similar para referencia
   */
  private static obtenerEjemploSimilar(tipo: string, equipo: string) {
    return REPORTES_EJEMPLO.find(ejemplo => 
      ejemplo.tipo.includes(tipo) || 
      ejemplo.equipo.toLowerCase().includes(equipo.toLowerCase())
    )?.ejemplo;
  }

  /**
   * 🎯 Genera prompt específico para diferentes tipos de reporte
   */
  static generarPromptEspecializado(tipo: 'diagnostico' | 'solucion' | 'recomendaciones', context: ReporteContext): string {
    const basePrompt = this.generarPromptProfesional(context);
    
    switch (tipo) {
      case 'diagnostico':
        return basePrompt + `\n\n**ENFOQUE ESPECIAL:** Concéntrate en el diagnóstico técnico detallado, incluyendo pruebas realizadas, mediciones obtenidas y análisis de causa raíz.`;
      
      case 'solucion':
        return basePrompt + `\n\n**ENFOQUE ESPECIAL:** Detalla paso a paso el procedimiento de reparación ejecutado, herramientas utilizadas y verificaciones realizadas.`;
      
      case 'recomendaciones':
        return basePrompt + `\n\n**ENFOQUE ESPECIAL:** Enfócate en recomendaciones específicas para prevenir futuras fallas, optimizar rendimiento y extender vida útil del equipo.`;
      
      default:
        return basePrompt;
    }
  }

  /**
   * 🔧 Genera prompt para casos específicos
   */
  static generarPromptParaCaso(caso: 'falla_critica' | 'mantenimiento_rutina' | 'instalacion_nueva', context: ReporteContext): string {
    const equipoInfo = this.obtenerInfoEquipo(context.equipo.nombre);
    
    let promptEspecifico = '';
    
    switch (caso) {
      case 'falla_critica':
        promptEspecifico = `
**CASO CRÍTICO - FALLA DE EQUIPO**
- Prioridad: ALTA
- Impacto: Equipo fuera de servicio
- Tiempo de respuesta: Inmediato
- Incluir: Plan de contingencia, tiempo estimado de reparación, alternativas temporales
${equipoInfo ? `- Códigos de falla conocidos: ${Object.keys(ARES_KNOWLEDGE_BASE.codigos_falla).slice(0, 3).join(', ')}` : ''}
        `;
        break;
        
      case 'mantenimiento_rutina':
        promptEspecifico = `
**MANTENIMIENTO PREVENTIVO RUTINARIO**
- Objetivo: Mantener operación óptima
- Enfoque: Prevención de fallas
- Incluir: Checklist completado, próxima fecha de servicio, estado general
${equipoInfo ? `- Intervalo recomendado: ${equipoInfo.mantenimiento_preventivo}` : ''}
        `;
        break;
        
      case 'instalacion_nueva':
        promptEspecifico = `
**INSTALACIÓN Y PUESTA EN MARCHA**
- Objetivo: Equipo operativo y personal capacitado
- Incluir: Verificación de sitio, configuración inicial, capacitación realizada
- Entregables: Manual de usuario, certificado de instalación, contactos de soporte
        `;
        break;
    }
    
    return this.generarPromptProfesional(context) + '\n\n' + promptEspecifico;
  }
}

/**
 * 🎨 HELPER PARA FORMATEAR REPORTES
 */
export class ReporteFormatter {
  
  /**
   * 📄 Agrega header profesional al reporte
   */
  static agregarHeader(reporte: string, context: ReporteContext): string {
    const fecha = new Date().toLocaleDateString('es-PY');
    const header = `
---
**ARES PARAGUAY - REPORTE TÉCNICO**
**Certificado ISO 9001 | 15 años de experiencia**

**Equipo:** ${context.equipo.nombre} - ${context.equipo.numeroSerie}
**Cliente:** ${context.equipo.cliente}
**Ubicación:** ${context.equipo.ubicacion}
**Fecha:** ${fecha}
**Técnico:** ${context.mantenimiento.tecnico}
**Tipo de Servicio:** ${context.mantenimiento.tipo.toUpperCase()}
---

`;
    return header + reporte;
  }

  /**
   * 📋 Agrega footer con información de contacto
   */
  static agregarFooter(reporte: string): string {
    const footer = `

---
**ARES PARAGUAY**
📧 soporte@aresparaguay.com | 📱 +595 21 123-4567
🌐 www.aresparaguay.com | 📍 Asunción, Paraguay

*Servicio técnico especializado las 24 horas*
*Garantía en todos nuestros trabajos*
---
`;
    return reporte + footer;
  }

  /**
   * ✨ Formatea el reporte completo
   */
  static formatearCompleto(reporte: string, context: ReporteContext): string {
    let reporteFormateado = this.agregarHeader(reporte, context);
    reporteFormateado = this.agregarFooter(reporteFormateado);
    return reporteFormateado;
  }
}