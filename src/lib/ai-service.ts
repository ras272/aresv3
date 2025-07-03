// Servicio de IA para generar reportes técnicos profesionales
// Usando Groq (gratis y muy rápido)

interface ReporteContext {
  equipo: {
    cliente: string;
    ubicacion: string;
    marca: string;
    modelo: string;
    nombreEquipo: string;
    numeroSerieBase: string;
    tipoEquipo: string;
    fechaEntrega: string;
  };
  mantenimiento: {
    fecha: string;
    descripcion: string;
    estado: string;
    comentarios?: string;
  };
  componente?: {
    nombre: string;
    numeroSerie: string;
    estado: string;
  };
  textoInformal: string;
  precioServicio: string;
}

class AIReporteService {
  private apiKey: string;
  private baseURL = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {
    // En producción, esto vendría de variables de entorno
    this.apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
  }

  async generarReporte(context: ReporteContext): Promise<string> {
    if (!this.apiKey) {
      // Fallback a simulación si no hay API key
      return this.generarReporteSimulado(context);
    }

    try {
      const prompt = this.construirPromptProfesional(context);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'user', 
              content: `${this.getSystemPrompt()}\n\n${prompt}`
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Groq API Error:', response.status, errorData);
        throw new Error(`Groq API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('Groq Response:', data); // Para debug
      const reporteGenerado = data.choices[0]?.message?.content;
      
      return this.formatearReporteFinal(context, reporteGenerado);

    } catch (error) {
      console.error('Error con Groq API:', error);
      
      // Verificar tipo de error
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Timeout - usando simulación');
        } else {
          console.log('Error API - usando simulación:', error.message);
        }
      }
      
      // Fallback a simulación
      return this.generarReporteSimulado(context);
    }
  }

  private getSystemPrompt(): string {
    return `Eres un ingeniero especializado en equipos médicos estéticos de ARES Paraguay.

Debes generar ÚNICAMENTE la sección "Trabajo Realizado" de un reporte técnico profesional siguiendo el formato corporativo de ARES.

FORMATO EXACTO REQUERIDO:
- Un solo párrafo continuo y fluido
- Lenguaje técnico profesional
- Descripción del problema encontrado
- Procedimientos realizados paso a paso
- Solución aplicada y resultado final
- Sin listas numeradas ni viñetas
- Sin títulos ni encabezados

EJEMPLO DE ESTILO:
"Se verificó el equipo y se encontró muy sucio tanto por fuera como por dentro, con los aplicadores visiblemente manchados de suciedad. Al probar la funcionalidad del equipo, apareció un error relacionado con el reservorio. Se abrió el equipo y se revisaron todas las conexiones, encontrando que las mangueras del circuito de succión de residuos estaban muy sucias. Al verificar el sensor de nivel de residuos, se comprobó que no funcionaba. Se realizó una conexión interna para evitar que el controlador verifique el nivel de residuos, y esta solución funcionó. El equipo quedó funcionando correctamente y a disposición del cliente."

INSTRUCCIONES:
- Expandir la descripción informal a texto técnico profesional
- Mantener un flujo narrativo natural
- Usar terminología médica apropiada
- Ser específico sobre procedimientos realizados
- Concluir con el estado final operativo`;
  }

  private construirPromptProfesional(context: ReporteContext): string {
    const { equipo, mantenimiento, textoInformal } = context;

    return `EQUIPO: ${equipo.marca} ${equipo.modelo}
CLIENTE: ${equipo.cliente}
PROBLEMA: ${mantenimiento.descripcion}

DESCRIPCIÓN INFORMAL:
"${textoInformal}"

Convierte esta descripción informal en un reporte técnico profesional con las 4 secciones solicitadas.`;
  }

  private formatearReporteFinal(context: ReporteContext, reporteIA: string): string {
    const { equipo, mantenimiento, precioServicio } = context;
    
    // Generar fecha en formato español
    const fechaHoy = new Date();
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const fechaFormateada = `${fechaHoy.getDate()} de ${meses[fechaHoy.getMonth()]} del ${fechaHoy.getFullYear()}`;
    
    // Generar números para el reporte
    const numeroReporte = this.generarNumeroReporte(equipo.marca, equipo.modelo);
    const numeroFormulario = this.generarNumeroFormulario();
    
    // Formatear precio del servicio proporcionado por el usuario
    const costoServicioFormateado = this.formatearPrecio(precioServicio);
    
    // Generar título del reporte basado en el problema
    const tituloReporte = this.generarTituloReporte(mantenimiento.descripcion);

    return `Lugar y Fecha    : Asunción, ${fechaFormateada}
Cliente          : ${equipo.cliente}
Nro. Rep.        : ${numeroReporte}
Reporte          : ${tituloReporte}

Formulario de Asistencia Nº : ${numeroFormulario}

Trabajo Realizado:

${reporteIA.trim()}

COSTO DEL SERVICIO: ${costoServicioFormateado} – IVA INCLUIDO
COSTO TOTAL: ${costoServicioFormateado} – IVA INCLUIDO

_______________
Ing. Javier López`;
  }

  private generarReporteSimulado(context: ReporteContext): string {
    // Simulación mejorada para cuando no hay API key
    const { textoInformal, mantenimiento } = context;
    
    // Generar descripción técnica simulada en formato de párrafo
    const reporteSimulado = this.procesarTextoInformalAParagrafo(textoInformal, mantenimiento.descripcion);

    return this.formatearReporteFinal(context, reporteSimulado);
  }

  private procesarTextoInformalAParagrafo(textoInformal: string, descripcionProblema: string): string {
    // Convertir texto informal a párrafo técnico profesional
    const mejoras = {
      'arregle': 'se procedió a reparar',
      'revise': 'se realizó inspección técnica de',
      'cambie': 'se reemplazó',
      'probe': 'se verificó el funcionamiento de',
      'funciona bien': 'opera dentro de parámetros normales',
      'estaba roto': 'presentaba falla técnica',
      'estaba dañado': 'presentaba deterioro en',
      'no funcionaba': 'no operaba correctamente',
      'medio roto': 'parcialmente dañado',
      'muy sucio': 'con acumulación significativa de residuos',
      'un poco': 'ligeramente',
      'bastante': 'considerablemente'
    };

    let textoMejorado = textoInformal;
    
    // Aplicar mejoras léxicas
    Object.entries(mejoras).forEach(([informal, formal]) => {
      const regex = new RegExp(informal, 'gi');
      textoMejorado = textoMejorado.replace(regex, formal);
    });

    // Construir párrafo técnico profesional
    const inicioTecnico = `Se verificó el equipo y se procedió con la inspección técnica correspondiente. `;
    const desarrolloTecnico = textoMejorado.trim();
    const finalTecnico = ` El equipo quedó funcionando correctamente y a disposición del cliente.`;
    
    let parrafoCompleto = inicioTecnico + desarrolloTecnico;
    
    if (!parrafoCompleto.includes('funciona') && !parrafoCompleto.includes('operativo')) {
      parrafoCompleto += finalTecnico;
    }

    // Asegurar que termine con punto
    if (!parrafoCompleto.endsWith('.')) {
      parrafoCompleto += '.';
    }

    return parrafoCompleto;
  }



  private calcularProximoMantenimiento(): string {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() + 6);
    return fecha.toLocaleDateString('es-ES');
  }

  private generarNumeroReporte(marca: string, modelo: string): string {
    // Generar número realista basado en la marca y modelo
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const prefijos = {
      'Classys': 'CL',
      'Dermed': 'DM', 
      'HIFU': 'HF',
      'Philips': 'PH',
      'GE': 'GE',
      'default': 'AR'
    };
    
    const prefijo = prefijos[marca as keyof typeof prefijos] || prefijos.default;
    const numeroSecuencial = Math.floor(Math.random() * 999) + 1;
    
    return `${numeroSecuencial.toString().padStart(4, '0')} ${modelo.slice(0, 8)}`;
  }

  private generarNumeroFormulario(): string {
    // Generar número de formulario correlativo
    const base = Math.floor(Math.random() * 9000) + 1000;
    return base.toString();
  }

  private calcularCostoServicio(): string {
    // Costos realistas en guaraníes paraguayos
    const costosBase = [250000, 300000, 330000, 350000, 400000, 450000, 500000];
    const costoSeleccionado = costosBase[Math.floor(Math.random() * costosBase.length)];
    
    // Formatear con puntos como separador de miles
    return costoSeleccionado.toLocaleString('es-PY');
  }

  private generarTituloReporte(descripcion: string): string {
    // Generar título profesional basado en la descripción del problema
    const palabrasClave = descripcion.toLowerCase();
    
    if (palabrasClave.includes('no enciende') || palabrasClave.includes('no funciona')) {
      return 'Falla de Encendido del Equipo';
    }
    if (palabrasClave.includes('error') || palabrasClave.includes('alarma')) {
      return 'Error de Funcionamiento';
    }
    if (palabrasClave.includes('calibr')) {
      return 'Calibración y Ajuste';
    }
    if (palabrasClave.includes('limpieza') || palabrasClave.includes('sucio')) {
      return 'Mantenimiento Preventivo';
    }
    if (palabrasClave.includes('reservorio') || palabrasClave.includes('residuo')) {
      return 'Error de Reservorio de Residuos';
    }
    if (palabrasClave.includes('sensor')) {
      return 'Falla de Sensores';
    }
    if (palabrasClave.includes('cable') || palabrasClave.includes('conexión')) {
      return 'Problema de Conectividad';
    }
    
    return 'Servicio Técnico Especializado';
  }

  private formatearPrecio(precio: string): string {
    // Limpiar el precio y convertir a número
    const precioLimpio = precio.replace(/[^\d]/g, '');
    
    if (!precioLimpio) {
      return '0';
    }
    
    // Convertir a número y formatear con puntos como separador de miles
    const numero = parseInt(precioLimpio);
    return numero.toLocaleString('es-PY');
  }
}

export const aiReporteService = new AIReporteService(); 