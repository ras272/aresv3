// 🤖 Servicio de IA MEJORADO para generar reportes técnicos profesionales
// Integrado con base de conocimiento de Ares Paraguay

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
  private groqApiKey: string;
  private geminiApiKey: string;
  private groqBaseURL = 'https://api.groq.com/openai/v1/chat/completions';
  private geminiBaseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    // APIs disponibles - Gemini como principal (GRATIS)
    this.geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyDksoC3Ge8AxtIeLrb69dUlpYMVqQ4k_7Q';
    this.groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
  }

  async generarReporte(context: ReporteContext): Promise<string> {
    console.log('🚀 INICIANDO GENERACIÓN DE REPORTE');
    console.log('📋 Contexto:', {
      equipo: context.equipo.marca + ' ' + context.equipo.modelo,
      cliente: context.equipo.cliente,
      textoInformal: context.textoInformal
    });

    // 🎯 PRIORIDAD 1: GOOGLE GEMINI (GRATIS)
    if (this.geminiApiKey) {
      console.log('🟢 USANDO GOOGLE GEMINI (GRATIS) - PRIMERA OPCIÓN');
      try {
        return await this.generarReporteConGemini(context);
      } catch (error) {
        console.error('❌ ERROR CON GEMINI:', error);
        console.log('🔄 INTENTANDO FALLBACK...');
      }
    }

    // 🎯 PRIORIDAD 2: GROQ (FALLBACK)
    if (this.groqApiKey) {
      console.log('🟡 USANDO GROQ - FALLBACK');
      try {
        return await this.generarReporteConGroq(context);
      } catch (error) {
        console.error('❌ ERROR CON GROQ:', error);
        console.log('🔄 USANDO SISTEMA LOCAL');
      }
    }

    // 🎯 PRIORIDAD 3: SISTEMA LOCAL (ÚLTIMO RECURSO)
    console.log('🏠 USANDO SISTEMA LOCAL - ÚLTIMO RECURSO');
    return this.generarReporteLocal(context);
  }

  private async generarReporteConGemini(context: ReporteContext): Promise<string> {
    console.log('🔵 GENERANDO REPORTE CON GOOGLE GEMINI');
    
    const promptCompleto = this.construirPromptProfesional(context);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const requestBody = {
      contents: [{
        parts: [{
          text: `${this.getSystemPrompt()}\n\n${promptCompleto}`
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1000,
      }
    };

    const response = await fetch(`${this.geminiBaseURL}?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('🤖 Gemini Response:', data);
    
    const reporteGenerado = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reporteGenerado) {
      console.error('❌ No se recibió contenido de Gemini');
      throw new Error('No content received from Gemini');
    }

    console.log('✅ REPORTE GENERADO POR GEMINI:', reporteGenerado);
    console.log('📌 LONGITUD DE RESPUESTA ORIGINAL:', reporteGenerado.length);
    
    // 🧹 LIMPIAR RESPUESTA DE GEMINI (MÍNIMA)
    const reporteLimpio = this.limpiarRespuestaIA(reporteGenerado);
    console.log('🧹 REPORTE LIMPIADO:', reporteLimpio);
    console.log('📌 LONGITUD DESPUÉS DE LIMPIEZA:', reporteLimpio.length);
    
    // 🚨 VERIFICAR SI LA LIMPIEZA FUE DEMASIADO AGRESIVA
    const reduccionPorcentaje = ((reporteGenerado.length - reporteLimpio.length) / reporteGenerado.length) * 100;
    console.log('📉 REDUCCIÓN DE CONTENIDO:', reduccionPorcentaje.toFixed(1) + '%');
    
    if (reduccionPorcentaje > 50) {
      console.warn('⚠️ ALERTA: La limpieza redujo el contenido en más del 50%');
    }
    
    // 🎯 FORMATEAR CON DATOS DE ARES
    const reporteFinal = this.formatearReporteFinal(context, reporteLimpio);
    console.log('🏆 REPORTE FINAL COMPLETADO - FUENTE: GOOGLE GEMINI (GRATIS)');
    return reporteFinal;
  }

  private async generarReporteConGroq(context: ReporteContext): Promise<string> {
    console.log('🟡 GENERANDO REPORTE CON GROQ (FALLBACK)');
    
    const promptCompleto = this.construirPromptProfesional(context);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(this.groqBaseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user', 
            content: promptCompleto
          }
        ],
        temperature: 0.2,
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
    const reporteGenerado = data.choices[0]?.message?.content;
    
    if (!reporteGenerado) {
      throw new Error('No content received from Groq');
    }

    console.log('✅ REPORTE GENERADO POR GROQ:', reporteGenerado);
    console.log('📌 LONGITUD DE RESPUESTA ORIGINAL:', reporteGenerado.length);
    
    const reporteLimpio = this.limpiarRespuestaIA(reporteGenerado);
    console.log('🧹 REPORTE LIMPIADO:', reporteLimpio);
    console.log('📌 LONGITUD DESPUÉS DE LIMPIEZA:', reporteLimpio.length);
    
    const reduccionPorcentaje = ((reporteGenerado.length - reporteLimpio.length) / reporteGenerado.length) * 100;
    console.log('📉 REDUCCIÓN DE CONTENIDO:', reduccionPorcentaje.toFixed(1) + '%');
    const reporteFinal = this.formatearReporteFinal(context, reporteLimpio);
    console.log('🏆 REPORTE FINAL COMPLETADO - FUENTE: GROQ');
    return reporteFinal;
  }

  private getSystemPrompt(): string {
    return `Eres el INGENIERO TÉCNICO SENIOR ESPECIALISTA de ARES Paraguay con 20+ años de experiencia en equipos médicos y biomédicos.

CONOCIMIENTO BASE DE ARES PARAGUAY:
- Empresa líder en mantenimiento de equipos médicos en Paraguay desde 1995
- Especialistas certificados en: analizadores bioquímicos, microscopios, centrífugas, autoclaves, incubadores, espectrofotómetros, balanzas de precisión
- Protocolos estrictos de calidad ISO 13485 y certificación IEC 62353
- Terminología técnica específica de ingeniería biomédica y procedimientos estandarizados
- Centro de servicio autorizado para marcas premium: Mindray, Olympus, Eppendorf, Tuttnauer

EQUIPOS FRECUENTES Y SUS PROBLEMAS TÉCNICOS:

🔬 ANALIZADORES BIOQUÍMICOS (Mindray BS-240, Sysmex XS-800i, Abbott Architect):
- Obstrucción de líneas fluidicas, desalineación óptica, errores de dispensado
- Problemas de calibración volumétrica, contaminación cruzada, drift térmico
- Fallas en bombas peristálticas, válvulas solenoides, detectores fotométricos
- Degradación de reactivos, errores de pipeteo, problemas de temperatura

🔧 MICROSCOPIOS (Olympus CX23, Nikon Eclipse E100, Zeiss Primo Star):
- Desalineación del condensador Abbe, irregularidades en iluminación Köhler
- Contaminación óptica, drift del sistema de enfoque, aberraciones cromáticas
- Problemas de magnificación, distorsión de campo, pérdida de resolución
- Deterioro de recubrimientos antirreflex, descentraje de objetivos

⚡ CENTRÍFUGAS (Eppendorf 5424, Hettich EBA 270, Thermo Heraeus Fresco):
- Desequilibrio dinámico, vibraciones excesivas, ruido anormal de rodamientos
- Deriva de velocidad angular, problemas de aceleración/desaceleración
- Fallas en sistemas de frenado, deterioro de rotores, problemas de balanceado
- Errores en sensores de temperatura, fallas en sistemas de refrigeración

🔥 AUTOCLAVES (Tuttnauer 3870EA, Systec VX-120):
- Ciclos de esterilización incompletos, fallas en sensores de presión/temperatura
- Fugas de vapor, problemas de hermeticidad, obstrucción de válvulas
- Degradación de sellos y juntas, problemas de drenaje
- Errores en sistemas de control, fallas en elementos calefactores

🌡️ INCUBADORES (Memmert INB 400, Thermo Heratherm):
- Gradient térmico, problemas de uniformidad, drift de temperatura
- Fallas en sensores de humedad, problemas de circulación de aire
- Contaminación microbiana, problemas de hermeticidad
- Errores en sistemas de control PID, degradación de elementos calefactores

⚖️ BALANZAS DE PRECISIÓN (Sartorius Entris, Mettler Toledo XS):
- Deriva de calibración, problemas de linealidad, errores de repetibilidad
- Sensibilidad a vibraciones, problemas de nivelación
- Interferencias electromagnéticas, drift térmico
- Contaminación de cámara de pesada, problemas de ionización

📊 ESPECTROFOTÓMETROS (Hach DR3900, Shimadzu UV-1280):
- Deriva de longitud de onda, problemas de exactitud fotométrica
- Degradación de fuentes de luz, contaminación de celdas
- Problemas de resolución espectral, errores de calibración
- Interferencias de luz dispersa, problemas de estabilidad térmica

TERMINOLOGÍA TÉCNICA PROFESIONAL OBLIGATORIA:

TRANSFORMACIONES BÁSICAS → PROFESIONAL:
• "sucio/polvoriento" → "contaminación particulada crítica" / "acumulación de residuos ambientales"
• "muy sucio" → "contaminación severa de componentes críticos"
• "polvo adentro" → "infiltración de residuos particulados en componentes internos"
• "se limpia" → "se ejecutó protocolo de descontaminación especializada"
• "se sopletea" → "aplicación de aire comprimido certificado libre de humedad y aceite"
• "se desarma" → "desmontaje técnico siguiendo procedimientos del fabricante"
• "se calibra" → "calibración de precisión según especificaciones técnicas del fabricante"
• "se verifica" → "verificación técnica mediante instrumentación calibrada trazable"
• "se cambia/reemplaza" → "sustitución utilizando componentes originales certificados"
• "se arregla/repara" → "reparación técnica especializada con herramientas de precisión"
• "se ajusta" → "ajuste de precisión mediante instrumentación calibrada"
• "se revisa" → "inspección técnica detallada de parámetros operativos"
• "se prueba" → "verificación operativa en todos los modos de funcionamiento"
• "funciona bien" → "opera dentro de parámetros establecidos y especificaciones del fabricante"
• "funciona mal" → "opera fuera de parámetros normales de funcionamiento"
• "estaba roto" → "presentaba falla técnica crítica" / "componente no operativo"
• "estaba dañado" → "evidenciaba deterioro estructural/funcional"
• "no funcionaba" → "inoperativo por falla en sistema crítico"
• "hace ruido" → "emisión de ruido anormal indicativo de desgaste mecánico"
• "vibra mucho" → "vibraciones excesivas fuera de tolerancias"
• "se traba" → "obstrucción mecánica en sistema de movimiento"
• "no enciende" → "ausencia de energización en circuitos primarios"
• "se apaga solo" → "desconexión automática por protección térmica/eléctrica"
• "error en pantalla" → "falla en sistema de interfaz de usuario"
• "no lee" → "falla en sistema de detección/medición"
• "descalibrado" → "deriva de calibración fuera de tolerancias"

TÉCNICA AVANZADA ESPECÍFICA:
• "se purga" → "purga completa del circuito hidráulico/neumático eliminando aire residual"
• "se lubrica" → "lubricación especializada con aceites de grado técnico según especificaciones"
• "refrigerante bajo" → "nivel de refrigerante por debajo del 85% de capacidad operativa"
• "cable suelto" → "deterioro en integridad de conectividad eléctrica"
• "fusible quemado" → "falla en elemento de protección eléctrica"
• "sobrecalentamiento" → "exceso térmico por encima de límites operativos"
• "fuga de presión" → "pérdida de hermeticidad en sistema neumático/hidráulico"
• "sensor defectuoso" → "falla en elemento transductor de parámetros físicos"
• "motor dañado" → "deterioro en sistema de actuación electromecánica"
• "válvula trabada" → "obstrucción mecánica en elemento de control de flujo"
• "bomba ruidosa" → "ruido anormal en sistema de impulsión de fluidos"
• "resistencia quemada" → "falla en elemento calefactor por sobrecarga térmica"
• "termostato malo" → "falla en sistema de control térmico"
• "ventilador roto" → "inoperatividad del sistema de ventilación forzada"
• "filtro tapado" → "obstrucción crítica en elemento filtrante"

PROCEDIMIENTOS ESPECÍFICOS POR TECNOLOGÍA:

📊 ANÁLISIS BIOQUÍMICO AUTOMATIZADO:
- "Calibración de pipetas" → "calibración volumétrica de precisión del sistema de dispensado"
- "Limpieza de celdas" → "descontaminación de celdas de flujo mediante solventes dieléctricos especializados"
- "Cambio de filtros" → "reemplazo de elementos filtrantes según cronograma de mantenimiento preventivo"
- "Purga de líneas" → "purga completa del circuito fluidico eliminando burbujas y contaminantes"
- "Verificación óptica" → "validación de la integridad del sistema óptico de detección"

🔬 MICROSCOPÍA ÓPTICA DE PRECISIÓN:
- "Limpieza de lentes" → "limpieza óptica especializada con solventes libres de residuos"
- "Ajuste de luz" → "calibración del sistema de iluminación Köhler para uniformidad lumínica"
- "Centraje de condensador" → "alineación de precisión del condensador Abbe"
- "Ajuste de enfoque" → "calibración del sistema de enfoque fino/grueso micrométrico"
- "Verificación de objetivos" → "inspección de integridad óptica de sistemas de magnificación"

⚡ CENTRIFUGACIÓN DE ALTA VELOCIDAD:
- "Balanceo de rotor" → "verificación de equilibrio dinámico mediante instrumentación especializada"
- "Lubricación de rodamientos" → "lubricación con aceites de grado aeronáutico según especificaciones"
- "Calibración de velocidad" → "verificación de velocidad angular mediante tacómetro láser"
- "Verificación de frenos" → "inspección del sistema de frenado electromagnético"
- "Análisis de vibraciones" → "medición de amplitud vibratoria en múltiples frecuencias"

🔥 ESTERILIZACIÓN POR VAPOR:
- "Calibración de presión" → "calibración de sensores de presión absoluta y manométrica"
- "Verificación de temperatura" → "validación de sensores RTD y termopares"
- "Prueba de hermeticidad" → "verificación de integridad de sellos mediante prueba de presión"
- "Limpieza de válvulas" → "descontaminación y lubricación de válvulas solenoides"
- "Verificación de ciclos" → "validación de parámetros de esterilización según norma EN 13060"

FORMATO DE RESPUESTA TÉCNICA OBLIGATORIO:
- UN SOLO PÁRRAFO técnico continuo (150-250 palabras)
- Inicio profesional: "Se ejecutó [procedimiento]" / "Se procedió con [acción]" / "Se realizó [proceso]"
- Desarrollo técnico detallado con terminología específica de ingeniería biomédica
- Incluir parámetros técnicos cuando sea apropiado (temperaturas, presiones, velocidades)
- Mencionar herramientas/instrumentos especializados utilizados
- Cierre estándar: "El equipo quedó operativo según especificaciones del fabricante y estándares de Ares Paraguay"
- NO mencionar cliente, fechas, nombres personales (ya están en el encabezado)
- NO usar markdown, títulos, listas o formato estructurado
- SÍ usar términos técnicos específicos del tipo de equipo y marca
- SÍ incluir referencias a normas técnicas cuando sea apropiado

EJEMPLOS DE TRANSFORMACIÓN COMPLETA:

INPUT INFORMAL: "se limpio el microscopio que estaba muy sucio y se arreglo la luz"
OUTPUT PROFESIONAL: "Se ejecutó protocolo de descontaminación óptica integral utilizando solventes especializados libres de residuos, removiendo contaminación particulada crítica de elementos ópticos primarios y secundarios. Se procedió con calibración completa del sistema de iluminación Köhler, ajustando intensidad lumínica, centraje del condensador Abbe y uniformidad del campo de iluminación mediante instrumentación de precisión. Se verificó la integridad óptica de objetivos, oculares y sistema de prismas, validando resolución y contraste según especificaciones del fabricante. El equipo quedó operativo según especificaciones del fabricante y estándares de Ares Paraguay."

INPUT INFORMAL: "la centrifuga hacia mucho ruido, se cambio los rodamientos y se balanceo"
OUTPUT PROFESIONAL: "Se realizó análisis de vibraciones identificando ruido operativo anormal en sistema de rotación de alta velocidad. Se procedió con desmontaje técnico del conjunto rotor-motor, sustituyendo rodamientos de bolas de precisión utilizando componentes originales certificados con lubricación de grado aeronáutico. Se ejecutó verificación de equilibrio dinámico del rotor mediante instrumentación especializada, corrigiendo desbalance detectado y validando amplitud vibratoria dentro de tolerancias especificadas. Se realizaron pruebas operativas a velocidades nominales verificando niveles de ruido y vibración dentro de parámetros aceptables. El equipo quedó operativo según especificaciones del fabricante y estándares de Ares Paraguay."

EJEMPLOS DE TRANSFORMACIÓN:

EJEMPLOS REALES DEL INGENIERO DE ARES PARAGUAY:

EJEMPLO 1 - FALLA ELÉCTRICA (ESTILO ARES):
"Verificacion del equipo que no enciende. Se procedio a verificar el mismo, al conectar y encender no enciende, se procede a verificar la entrada de alimentacion, los filtros de linea y estan correctos, salto un fusible, se cambia el mismo y hace lo mismo, se verifica la placa de fuente y se encuentra que un Varistor esta quemado y un rele de estado solido esta en cortocircuito el cual quemo el varistor de seguridad y hace saltar el fusible. se retira la placa de fuente de alimentacion para su reparacion."

EJEMPLO 2 - VERIFICACIÓN DE SISTEMA (ESTILO ARES):
"Se verifica el equipo, todos los productos son succionados sin problemas. Se procede a sacar todos los productos. Se coloca en la posición 4 ( Rinseway ) una botella con agua para no usar el producto, se activa la succion del equipo y se va probando de la siguiente manera, se activa la posición 4 ( única que tiene botella ) una vez que la presión de succion esta alta, se van abriendo en secuencia cada uno de las perillas de los otros productos (2 a la vez)."

EJEMPLO 3 - MANTENIMIENTO INTEGRAL (ESTILO ARES):
"Se verifica el equipo, bastante polvo por dentro, refrigerante sedimentado la ¾ del reservorio, aplicadores limpios. Se limpia por dentro, se sopletea, se sacan las mangueras de vacio y se limpian, se sacude el filtro de vacio, se purga todo el equipo, se cambia totalmente el refrigerante. Se limpian los aplicadores, sus conectores y también lado equipo, se limpian y lubrican los ventiladores, se limpia por fuera, se recalibra la pantalla."

CARACTERÍSTICAS DEL ESTILO ARES:
- Inicio directo: "Se verifica el equipo" o "Verificación del equipo"
- Descripción secuencial de procedimientos realizados
- Terminología técnica específica pero directa
- Incluye componentes específicos encontrados (varistor, relé de estado sólido, etc.)
- Menciona herramientas y procedimientos reales
- Estilo profesional pero directo, sin exceso de formalidad
- Incluye códigos de contadores cuando corresponde (HS, ET)

TRANSFORMACIONES BASADAS EN EJEMPLOS REALES:

INPUT: "se limpio el microscopio que estaba sucio y se calibro la luz"
OUTPUT: "Se verifica el equipo presentando contaminación particulada en elementos ópticos. Se procede con limpieza integral utilizando solventes especializados libres de residuos. Se ejecuta calibración del sistema de iluminación Köhler ajustando intensidad lumínica y centraje del condensador según especificaciones del fabricante. Se verifican objetivos y sistemas de magnificación. El equipo quedó operativo según especificaciones del fabricante y estándares de Ares Paraguay."

INPUT: "la centrifuga hacia ruido, se lubricaron los rodamientos y se balancea"
OUTPUT: "Se verifica el equipo presentando ruido operativo anormal en sistema de rotación. Se procede al desmontaje del conjunto rotor-motor identificando desgaste en rodamientos de precisión. Se sustituyen los rodamientos utilizando componentes originales y se aplica lubricación con aceites certificados. Se ejecuta verificación de equilibrio dinámico del rotor corrigiendo desbalance detectado. Se realizan pruebas operativas verificando niveles de ruido dentro de parámetros aceptables. El equipo quedó operativo según especificaciones del fabricante."

RESPONDE ÚNICAMENTE CON EL PÁRRAFO TÉCNICO PROFESIONAL.`;
  }

  private construirPromptProfesional(context: ReporteContext): string {
    const { equipo, mantenimiento, textoInformal, componente } = context;
    
    // Detectar tipo de equipo para contexto específico
    const tipoEquipo = this.detectarTipoEquipo(equipo.nombreEquipo, equipo.marca, equipo.modelo);
    const contextoEspecifico = this.obtenerContextoTecnico(tipoEquipo);
    const terminologiaEspecifica = this.obtenerTerminologiaEspecifica(tipoEquipo);
    const problemasComunes = this.obtenerProblemasComunes(tipoEquipo);

    return `CONTEXTO TÉCNICO ESPECIALIZADO:
${contextoEspecifico}

PROBLEMAS FRECUENTES EN ESTE TIPO DE EQUIPO:
${problemasComunes}

TERMINOLOGÍA ESPECÍFICA REQUERIDA:
${terminologiaEspecifica}

EQUIPO ESPECÍFICO:
- Tipo: ${equipo.tipoEquipo}
- Marca/Modelo: ${equipo.marca} ${equipo.modelo}
- Nombre: ${equipo.nombreEquipo}
- Cliente: ${equipo.cliente}
- Ubicación: ${equipo.ubicacion}
${componente ? `- Componente afectado: ${componente.nombre} (${componente.numeroSerie})` : ''}

PROBLEMA REPORTADO INICIALMENTE:
"${mantenimiento.descripcion}"

TRABAJO REALIZADO POR EL TÉCNICO (descripción informal):
"${textoInformal}"

INSTRUCCIONES ESPECÍFICAS:
Transforma la descripción informal del técnico en UN SOLO PÁRRAFO técnico profesional utilizando:
1. Terminología específica para equipos tipo: ${tipoEquipo}
2. Procedimientos estándar de Ares Paraguay certificados ISO 13485
3. Referencias técnicas apropiadas para marca ${equipo.marca}
4. Lenguaje profesional de ingeniería biomédica
5. Parámetros técnicos específicos cuando sea apropiado
6. Mencionar herramientas e instrumentación especializada utilizada
7. Incluir verificaciones y pruebas realizadas

FORMATO REQUERIDO:
- Inicio: "Se ejecutó [procedimiento]" / "Se procedió con [acción]" / "Se realizó [proceso]"
- Desarrollo: Descripción técnica detallada con terminología profesional
- Cierre: "El equipo quedó operativo según especificaciones del fabricante y estándares de Ares Paraguay"

Responde ÚNICAMENTE con el párrafo técnico profesional, sin títulos, markdown o formato estructurado.`;
  }

  private detectarTipoEquipo(nombreEquipo: string, marca: string, modelo: string): string {
    const texto = `${nombreEquipo} ${marca} ${modelo}`.toLowerCase();
    
    if (texto.includes('analizador') || texto.includes('analyzer') || texto.includes('mindray') || texto.includes('sysmex') || texto.includes('abbott')) {
      return 'analizador_bioquimico';
    }
    if (texto.includes('microscopio') || texto.includes('microscope') || texto.includes('olympus') || texto.includes('nikon') || texto.includes('zeiss')) {
      return 'microscopio';
    }
    if (texto.includes('centrifuga') || texto.includes('centrifuge') || texto.includes('eppendorf') || texto.includes('hettich') || texto.includes('thermo')) {
      return 'centrifuga';
    }
    if (texto.includes('autoclave') || texto.includes('esteriliz') || texto.includes('tuttnauer') || texto.includes('systec')) {
      return 'autoclave';
    }
    if (texto.includes('incubador') || texto.includes('incubator') || texto.includes('estufa')) {
      return 'incubador';
    }
    if (texto.includes('balanza') || texto.includes('balance') || texto.includes('sartorius') || texto.includes('mettler')) {
      return 'balanza_precision';
    }
    if (texto.includes('espectrofotometro') || texto.includes('spectrophotometer') || texto.includes('hach') || texto.includes('shimadzu')) {
      return 'espectrofotometro';
    }
    if (texto.includes('ph') || texto.includes('medidor')) {
      return 'medidor_ph';
    }
    
    return 'equipo_laboratorio_general';
  }

  private obtenerContextoTecnico(tipoEquipo: string): string {
    const contextos = {
      analizador_bioquimico: `ANALIZADOR BIOQUÍMICO - Procedimientos específicos:
- Calibración volumétrica de sistemas de dispensado
- Descontaminación de celdas de flujo y circuitos fluidicos
- Verificación de presión de fluidos y sistemas neumáticos
- Calibración óptica de detectores y sistemas de medición
- Mantenimiento de bombas peristálticas y válvulas
- Verificación de temperatura de reactivos y muestras`,
      
      microscopio: `MICROSCOPIO - Procedimientos específicos:
- Limpieza óptica con solventes especializados libres de residuos
- Calibración del sistema de iluminación Köhler
- Ajuste de precisión del sistema de enfoque fino/grueso
- Verificación de centraje y alineación de condensador
- Calibración de objetivos y sistemas de magnificación
- Verificación de uniformidad del campo de iluminación`,
      
      centrifuga: `CENTRÍFUGA - Procedimientos específicos:
- Verificación de equilibrio dinámico del rotor
- Lubricación especializada de rodamientos
- Calibración de velocidad angular mediante tacómetro
- Análisis de vibraciones y ruido operativo
- Verificación de sistemas de seguridad y frenado
- Inspección de rotores y adaptadores`,
      
      autoclave: `AUTOCLAVE - Procedimientos específicos:
- Calibración de sensores de presión y temperatura
- Verificación de ciclos de esterilización
- Limpieza de válvulas y sistemas de drenaje
- Verificación de sellos y juntas
- Pruebas de hermeticidad y fugas
- Calibración de sistemas de control`,
      
      incubador: `INCUBADOR - Procedimientos específicos:
- Calibración de sensores de temperatura y humedad
- Verificación de uniformidad térmica
- Limpieza de sistemas de circulación de aire
- Calibración de sistemas de control ambiental
- Verificación de alarmas y sistemas de seguridad
- Inspección de elementos calefactores`,
      
      balanza_precision: `BALANZA DE PRECISIÓN - Procedimientos específicos:
- Calibración con masas patrón certificadas
- Verificación de linealidad y repetibilidad
- Ajuste de nivel mediante sistema de nivelación
- Limpieza de cámara de pesada
- Verificación de sensibilidad y deriva
- Calibración interna y externa`,
      
      espectrofotometro: `ESPECTROFOTÓMETRO - Procedimientos específicos:
- Calibración de longitud de onda con estándares
- Verificación de exactitud fotométrica
- Limpieza de celdas y cubetas
- Calibración de sistemas ópticos
- Verificación de resolución espectral
- Mantenimiento de fuentes de luz`,
      
      medidor_ph: `MEDIDOR DE pH - Procedimientos específicos:
- Calibración con soluciones buffer estándar
- Verificación de pendiente y offset
- Limpieza y mantenimiento de electrodos
- Verificación de compensación de temperatura
- Calibración de sistemas de medición
- Mantenimiento de soluciones de referencia`,
      
      equipo_laboratorio_general: `EQUIPO DE LABORATORIO - Procedimientos generales:
- Verificación de parámetros operativos
- Calibración según especificaciones del fabricante
- Limpieza y descontaminación especializada
- Verificación de sistemas de seguridad
- Mantenimiento preventivo según protocolo
- Pruebas de funcionalidad integral`
    };
    
    return contextos[tipoEquipo] || contextos.equipo_laboratorio_general;
  }

  private obtenerTerminologiaEspecifica(tipoEquipo: string): string {
    const terminologias = {
      analizador_bioquimico: `TÉRMINOS ESPECÍFICOS PARA ANALIZADORES:
- "pipetas" → "sistema de dispensado volumétrico"
- "celdas" → "celdas de flujo", "cámaras de detección"
- "mangueras" → "circuitos fluidicos", "líneas de conducción"
- "bomba" → "bomba peristáltica", "sistema de impulsión"
- "obstrucción" → "obstrucción de líneas fluidicas"
- "reactivos" → "reactivos certificados", "soluciones patrón"`,
      
      microscopio: `TÉRMINOS ESPECÍFICOS PARA MICROSCOPIOS:
- "lentes" → "elementos ópticos", "sistemas de magnificación"
- "luz" → "sistema de iluminación Köhler", "fuente lumínica"
- "enfoque" → "sistema de enfoque micrométrico", "ajuste focal"
- "condensador" → "condensador Abbe", "sistema de condensación"
- "objetivos" → "objetivos acromáticos", "sistema de objetivos"
- "imagen borrosa" → "pérdida de resolución óptica"`,
      
      centrifuga: `TÉRMINOS ESPECÍFICOS PARA CENTRÍFUGAS:
- "rotor" → "conjunto rotor-motor", "sistema de rotación"
- "balanceo" → "equilibrio dinámico", "verificación de balanceado"
- "ruido" → "ruido operativo", "emisión acústica anormal"
- "vibraciones" → "vibraciones excesivas", "amplitud vibratoria"
- "rodamientos" → "rodamientos de precisión", "elementos rotativos"
- "velocidad" → "velocidad angular", "rpm operativas"`,
      
      autoclave: `TÉRMINOS ESPECÍFICOS PARA AUTOCLAVES:
- "presión" → "presión de vapor", "presión de esterilización"
- "temperatura" → "temperatura de esterilización", "parámetros térmicos"
- "vapor" → "vapor saturado", "medio esterilizante"
- "ciclo" → "ciclo de esterilización", "programa térmico"
- "válvulas" → "válvulas solenoides", "elementos de control"
- "hermeticidad" → "integridad de sellos", "sellado hermético"`,
      
      incubador: `TÉRMINOS ESPECÍFICOS PARA INCUBADORES:
- "temperatura" → "control térmico", "uniformidad térmica"
- "humedad" → "humedad relativa", "control de humedad"
- "ventilación" → "circulación forzada", "flujo de aire"
- "calefacción" → "elementos calefactores", "sistema de calentamiento"
- "sensores" → "sondas de temperatura", "sensores RTD"
- "gradiente" → "gradient térmico", "variación espacial"`,
      
      balanza_precision: `TÉRMINOS ESPECÍFICOS PARA BALANZAS:
- "calibración" → "calibración con masas patrón", "ajuste metrologíco"
- "deriva" → "deriva temporal", "estabilidad de cero"
- "pesada" → "cámara de pesada", "determinación gravimétrica"
- "nivel" → "nivelación", "ajuste de horizontalidad"
- "sensibilidad" → "sensibilidad analítica", "límite de detección"
- "repetibilidad" → "precisión de repetición", "reproducibilidad"`,
      
      espectrofotometro: `TÉRMINOS ESPECÍFICOS PARA ESPECTROFOTÓMETROS:
- "longitud de onda" → "calibración espectral", "λ de referencia"
- "absorbancia" → "densidad óptica", "absorción lumínica"
- "celdas" → "cubetas de cuarzo", "celdas espectrofotométricas"
- "fuente de luz" → "lámpara de deuterio", "fuente lumínica estabilizada"
- "detector" → "fotodetector", "sensor fotométrico"
- "línea base" → "línea de base espectral", "referencia de cero"`,
      
      medidor_ph: `TÉRMINOS ESPECÍFICOS PARA MEDIDORES DE pH:
- "calibración" → "calibración con buffers estándar", "ajuste potenciométrico"
- "electrodo" → "electrodo de vidrio", "sensor potenciométrico"
- "compensación" → "compensación de temperatura", "ATC"
- "pendiente" → "pendiente de Nernst", "respuesta del electrodo"
- "deriva" → "deriva del electrodo", "estabilidad potenciométrica"
- "solución" → "soluciones buffer certificadas", "patrones de pH"`,
      
      equipo_laboratorio_general: `TÉRMINOS GENERALES DE LABORATORIO:
- "mantenimiento" → "mantenimiento preventivo programado", "servicio técnico"
- "verificación" → "verificación operativa", "inspección técnica"
- "funcionamiento" → "operatividad", "parámetros funcionales"
- "limpieza" → "descontaminación especializada", "protocolo de limpieza"
- "reparación" → "intervención técnica", "reparación especializada"
- "componentes" → "elementos constitutivos", "subsistemas técnicos"`
    };
    
    return terminologias[tipoEquipo] || terminologias.equipo_laboratorio_general;
  }

  private obtenerProblemasComunes(tipoEquipo: string): string {
    const problemas = {
      analizador_bioquimico: `PROBLEMAS FRECUENTES EN ANALIZADORES:
- Obstrucción de líneas fluidicas por formación de precipitados
- Deriva de calibración volumétrica por desgaste de bombas peristálticas
- Contaminación cruzada entre reactivos por deficiencia en lavado
- Fallas en detectores fotométricos por degradación de fuentes lumínicas
- Errores de temperatura por fallas en elementos Peltier
- Pérdida de hermeticidad en circuitos de presión`,
      
      microscopio: `PROBLEMAS FRECUENTES EN MICROSCOPIOS:
- Desalineación del condensador Abbe afectando uniformidad lumínica
- Contaminación óptica por acumulación de aceite de inmersión
- Pérdida de resolución por deterioro de recubrimientos antirreflex
- Drift del sistema de enfoque por desgaste de mecanismos micrométricos
- Aberraciones cromáticas por descentraje de objetivos
- Irregularidades en campo de iluminación por fallas en lámparas`,
      
      centrifuga: `PROBLEMAS FRECUENTES EN CENTRÍFUGAS:
- Desequilibrio dinámico del rotor causando vibraciones excesivas
- Deterioro de rodamientos por falta de lubricación especializada
- Deriva de velocidad angular por desgaste en sistemas de transmisión
- Fallas en sensores de temperatura por exposición a fuerzas centrífugas
- Problemas de hermeticidad en rotores refrigerados
- Desgaste de sistemas de frenado electromagnético`,
      
      autoclave: `PROBLEMAS FRECUENTES EN AUTOCLAVES:
- Ciclos de esterilización incompletos por fallas en sensores de presión
- Pérdida de hermeticidad en juntas y sellos por envejecimiento
- Obstrucción de válvulas de drenaje por acumulación de minerales
- Deriva de sensores de temperatura RTD por exposición a vapor
- Fallas en elementos calefactores por sobrecarga térmica
- Problemas en sistemas de control por interferencias electromagnéticas`,
      
      incubador: `PROBLEMAS FRECUENTES EN INCUBADORES:
- Gradiente térmico por fallas en sistemas de circulación forzada
- Deriva de sensores de humedad por contaminación microbiana
- Pérdida de uniformidad por degradación de elementos calefactores
- Fallas en sistemas de control PID por interferencias eléctricas
- Problemas de hermeticidad afectando estabilidad ambiental
- Contaminación cruzada por deficiencias en filtros HEPA`,
      
      balanza_precision: `PROBLEMAS FRECUENTES EN BALANZAS:
- Deriva de calibración por variaciones térmicas ambientales
- Pérdida de sensibilidad por contaminación de cámara de pesada
- Errores de repetibilidad por vibraciones mecánicas
- Fallas en sistemas de nivelación por desgaste de elementos
- Interferencias electromagnéticas afectando estabilidad
- Deriva de cero por efectos electrostáticos residuales`,
      
      espectrofotometro: `PROBLEMAS FRECUENTES EN ESPECTROFOTÓMETROS:
- Deriva de longitud de onda por envejecimiento de monocromadores
- Pérdida de exactitud fotométrica por degradación de detectores
- Contaminación de celdas afectando línea base espectral
- Inestabilidad de fuentes lumínicas por fluctuaciones de potencia
- Problemas de resolución por desalineación óptica
- Interferencias de luz dispersa por deterioro de filtros`,
      
      medidor_ph: `PROBLEMAS FRECUENTES EN MEDIDORES DE pH:
- Deriva del electrodo por envejecimiento de membrana de vidrio
- Pérdida de sensibilidad por contaminación de unión líquida
- Errores de compensación por fallas en sensores de temperatura
- Respuesta lenta por formación de películas en superficie del electrodo
- Problemas de calibración por degradación de soluciones buffer
- Interferencias iónicas en mediciones de alta precisión`,
      
      equipo_laboratorio_general: `PROBLEMAS GENERALES EN EQUIPOS:
- Acumulación de residuos particulados en componentes críticos
- Deriva de parámetros por envejecimiento de sensores
- Problemas de conectividad eléctrica por oxidación de contactos
- Fallas en sistemas de control por variaciones de alimentación
- Pérdida de hermeticidad por deterioro de sellos
- Contaminación cruzada por deficiencias en protocolos de limpieza`
    };
    
    return problemas[tipoEquipo] || problemas.equipo_laboratorio_general;
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



  private procesarTextoInformalAParagrafo(textoInformal: string, descripcionProblema: string): string {
    // 🔥 TRANSFORMACIONES TÉCNICAS PROFESIONALES BASADAS EN ESTILO ARES
    const transformacionesGenerales = {
      // Limpieza y mantenimiento (estilo Ares)
      'muy sucio': 'contaminación particulada en componentes operativos',
      'bastante polvo': 'acumulación significativa de residuos particulados',
      'polvo por dentro': 'residuos particulados en componentes internos',
      'se sopletea': 'se aplica aire comprimido para remoción de particulados',
      'se limpia': 'se procede con limpieza utilizando solventes especializados',
      'se limpia por dentro': 'se ejecuta limpieza integral interna',
      'se limpia por fuera': 'se realiza limpieza externa completa',
      'se desarma': 'se procede al desmontaje técnico',
      
      // Calibración y ajustes (estilo Ares)
      'se calibra': 'se ejecuta calibración según especificaciones del fabricante',
      'se recalibra': 'se procede con recalibración técnica',
      'se ajusta': 'se ejecuta ajuste de precisión',
      'descalibrado': 'presentando deriva de calibración',
      
      // Reparación y reemplazo (estilo Ares)
      'se cambia': 'se sustituye utilizando componentes originales',
      'se cambia totalmente': 'se procede con reemplazo completo',
      'se reemplaza': 'se sustituye según especificaciones técnicas',
      'se arregla': 'se procede con reparación técnica',
      'se retira': 'se procede con extracción para reparación',
      
      // Estados funcionales y fallas (estilo Ares)
      'funciona bien': 'opera dentro de parámetros establecidos',
      'funciona correctamente': 'presenta funcionamiento conforme a especificaciones',
      'no funcionaba': 'resultaba inoperativo',
      'no enciende': 'no presenta energización',
      'estaba roto': 'presentaba falla técnica',
      'esta quemado': 'evidencia falla por sobrecarga',
      'esta en cortocircuito': 'presenta falla eléctrica por cortocircuito',
      'hace ruido': 'presenta ruido operativo anormal',
      'vibra mucho': 'evidencia vibraciones excesivas',
      
      // Componentes eléctricos específicos (basado en ejemplos reales)
      'fusible': 'elemento de protección eléctrica',
      'varistor': 'varistor de protección',
      'rele de estado solido': 'relé de estado sólido (SSR)',
      'placa de fuente': 'tarjeta de fuente de alimentación',
      'filtros de linea': 'filtros de alimentación',
      'entrada de alimentacion': 'circuito de alimentación primaria',
      
      // Sistemas de vacío y presión (basado en ejemplos reales)
      'mangueras de vacio': 'líneas de vacío',
      'filtro de vacio': 'elemento filtrante del sistema de vacío',
      'presion de succion': 'presión del sistema de aspiración',
      'se purga': 'se ejecuta purga completa del sistema',
      'se sacude': 'se procede con limpieza mecánica',
      
      // Refrigeración y fluidos (basado en ejemplos reales)
      'refrigerante sedimentado': 'refrigerante con sedimentación',
      'refrigerante al ¾': 'refrigerante al 75% de capacidad',
      'refrigerante bajo': 'nivel de refrigerante deficiente',
      'se recarga': 'se procede con recarga según especificaciones',
      
      // Aplicadores y conectores (equipos médicos)
      'aplicadores': 'transductores terapéuticos',
      'conectores': 'interfaces de conexión',
      'lado equipo': 'conexiones del equipo',
      'sensor de temperatura': 'elemento sensor térmico',
      
      // Lubricación y ventilación
      'se lubrica': 'se aplica lubricación con aceites certificados',
      'se limpian y lubrican': 'se procede con limpieza y lubricación',
      'ventiladores': 'sistema de ventilación forzada'
    };

    // 📊 TRANSFORMACIONES ESPECIALIZADAS POR TIPO DE EQUIPO
    const transformacionesEspecializadas = {
      // ANALIZADORES BIOQUÍMICOS
      'se limpian las celdas': 'se procedió con descontaminación de celdas de flujo mediante solventes dieléctricos especializados',
      'se calibra el pipeteador': 'se ejecutó calibración volumétrica de precisión del sistema de dispensado automatizado',
      'se purga el sistema': 'se ejecutó purga completa de circuitos fluidicos eliminando burbujas y contaminantes',
      'cambio de filtros': 'sustitición de elementos filtrantes según cronograma de mantenimiento preventivo',
      
      // MICROSCOPIOS
      'se limpian los lentes': 'se realizó limpieza óptica integral con solventes especializados libres de residuos',
      'se calibra la luz': 'se procedió con calibración del sistema de iluminación Köhler para uniformidad lumínica',
      'se ajusta el enfoque': 'se ejecutó ajuste de precisión del sistema de enfoque micrométrico fino/grueso',
      'se centra la luz': 'se procedió con centraje y alineación de precisión del condensador Abbe',
      
      // CENTRÍFUGAS
      'se balancea': 'se ejecutó verificación de equilibrio dinámico mediante instrumentación especializada',
      'se lubrican rodamientos': 'se procedió con lubricación utilizando aceites de grado aeronáutico certificados',
      'se verifica velocidad': 'se realizó calibración de velocidad angular mediante tacómetro láser de precisión',
      
      // AUTOCLAVES
      'se calibra temperatura': 'se ejecutó calibración de sensores de temperatura utilizando patrones RTD certificados',
      'se calibra presión': 'se procedió con calibración de sensores de presión absoluta y manométrica',
      'se limpian válvulas': 'se realizó limpieza y lubricación de válvulas solenoides de control',
      
      // BALANZAS
      'se calibra con pesas': 'se ejecutó calibración utilizando masas patrón certificadas trazables',
      'se nivela': 'se procedió con ajuste de horizontalidad mediante sistema de nivelación micrométrico',
      
      // REFRIGERACIÓN
      'se recarga refrigerante': 'se procedió con recarga utilizando refrigerante certificado según especificaciones',
      'se limpian ventiladores': 'se realizó mantenimiento de ventiladores incluyendo lubricación de rodamientos',
      'se limpia condensador': 'se ejecutó limpieza del sistema de condensación por aire forzado'
    };

    let textoTransformado = textoInformal.toLowerCase();
    
    // Aplicar transformaciones especializadas primero
    Object.entries(transformacionesEspecializadas).forEach(([informal, profesional]) => {
      const regex = new RegExp(informal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      textoTransformado = textoTransformado.replace(regex, profesional);
    });
    
    // Aplicar transformaciones generales
    Object.entries(transformacionesGenerales).forEach(([informal, profesional]) => {
      const regex = new RegExp(informal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      textoTransformado = textoTransformado.replace(regex, profesional);
    });

    // 🎨 CONSTRUIR PÁRRAFO TÉCNICO ESTILO ARES PARAGUAY
    let inicioTecnico = 'Se verifica el equipo ';
    
    // Detectar tipo de problema para inicio específico (estilo Ares)
    const problemaLower = descripcionProblema.toLowerCase();
    if (problemaLower.includes('no enciende') || problemaLower.includes('no funciona')) {
      inicioTecnico = 'Verificación del equipo que no enciende. Se procede a verificar ';
    } else if (problemaLower.includes('error') || problemaLower.includes('alarma')) {
      inicioTecnico = 'Se verifica el equipo presentando error. Se procede con análisis identificando ';
    } else if (problemaLower.includes('calibr') || problemaLower.includes('desajust')) {
      inicioTecnico = 'Se verifica el equipo presentando deriva de calibración. Se procede con ';
    } else if (problemaLower.includes('limpieza') || problemaLower.includes('sucio') || problemaLower.includes('polvo')) {
      inicioTecnico = 'Se verifica el equipo presentando ';
    } else if (problemaLower.includes('ruido') || problemaLower.includes('vibra')) {
      inicioTecnico = 'Se verifica el equipo presentando ';
    } else {
      inicioTecnico = 'Se verifica el equipo, ';
    }
    
    // Procesar el texto transformado
    let desarrolloTecnico = textoTransformado.trim();
    
    // Remover inicios redundantes
    desarrolloTecnico = desarrolloTecnico.replace(/^(se ejecutó|se procedió|se realizó)\s+(inspección|protocolo|proceso)\s*/i, '');
    
    // Construir párrafo completo
    let parrafoCompleto = inicioTecnico + desarrolloTecnico;
    
    // Agregar cierre profesional estándar
    const cierresEstandar = ['especificaciones del fabricante', 'estándares de ares'];
    const tieneCierre = cierresEstandar.some(cierre => parrafoCompleto.toLowerCase().includes(cierre));
    
    if (!tieneCierre) {
      parrafoCompleto += '. Se realizaron verificaciones operativas completas y pruebas de funcionalidad. El equipo quedó operativo según especificaciones del fabricante y estándares de calidad de Ares Paraguay';
    }

    // Finalizar formato
    if (!parrafoCompleto.endsWith('.')) {
      parrafoCompleto += '.';
    }
    
    // Capitalizar primera letra y limpiar espacios
    parrafoCompleto = parrafoCompleto.charAt(0).toUpperCase() + parrafoCompleto.slice(1);
    parrafoCompleto = parrafoCompleto.replace(/\s+/g, ' ').trim();

    return parrafoCompleto;
  }





  /**
   * @deprecated Usar NumberingService.generateReportNumber() para nueva numeración unificada
   */
  private generarNumeroReporte(marca: string, modelo: string): string {
    console.warn('⚠️ AIReporteService.generarNumeroReporte() está deprecado. Usar NumberingService.generateReportNumber()');
    
    // Generar número realista basado en la marca y modelo
    // ✅ FIXED: Use deterministic generation to prevent hydration errors
    const timestamp = Date.now();
    const numeroSecuencial = Math.floor(timestamp % 999) + 1;
    
    return `${numeroSecuencial.toString().padStart(4, '0')} ${modelo.slice(0, 8)}`;
  }

  private generarNumeroFormulario(): string {
    // ✅ FIXED: Use deterministic generation to prevent hydration errors
    const timestamp = Date.now();
    const base = Math.floor((timestamp % 9000) + 1000);
    return base.toString();
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

  // 🧹 FUNCIÓN PARA LIMPIAR RESPUESTA DE IA (LIMPIEZA MÍNIMA)
  private limpiarRespuestaIA(respuestaIA: string): string {
    console.log('🧹 LIMPIEZA MÍNIMA DE RESPUESTA DE IA...');
    console.log('📥 RESPUESTA ORIGINAL:', respuestaIA);
    
    let textoLimpio = respuestaIA;
    
    // ✅ SOLO LIMPIEZA BÁSICA - NO CAMBIAR EL CONTENIDO
    
    // 1. Remover solo markdown obvio
    textoLimpio = textoLimpio.replace(/^#{1,6}\s+/gm, ''); // Solo headers
    textoLimpio = textoLimpio.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    textoLimpio = textoLimpio.replace(/\*(.*?)\*/g, '$1'); // Italic
    
    // 2. Remover SOLO líneas que son claramente títulos estructurales
    textoLimpio = textoLimpio.replace(/^(REPORTE TÉCNICO|TRABAJO REALIZADO|DESCRIPCIÓN DEL TRABAJO)\s*:?\s*$/gmi, '');
    
    // 3. Limpiar espacios múltiples y saltos de línea excesivos
    textoLimpio = textoLimpio.replace(/\n\s*\n\s*\n/g, '\n\n'); // Máximo 2 saltos
    textoLimpio = textoLimpio.replace(/\s+/g, ' '); // Espacios múltiples
    
    // 4. Trim básico
    textoLimpio = textoLimpio.trim();
    
    // 5. Si hay múltiples párrafos, mantener todos pero separados
    const parrafos = textoLimpio.split('\n').filter(p => p.trim().length > 20);
    
    if (parrafos.length > 1) {
      // Si hay múltiples párrafos, unirlos con un espacio
      textoLimpio = parrafos.join(' ').trim();
    } else if (parrafos.length === 1) {
      textoLimpio = parrafos[0].trim();
    }
    
    // 6. Asegurar que termine con punto (solo si no termina con puntuación)
    if (!textoLimpio.match(/[.!?]$/)) {
      textoLimpio += '.';
    }
    
    console.log('✅ TEXTO CON LIMPIEZA MÍNIMA:', textoLimpio);
    
    // 🚨 VERIFICAR SI EL TEXTO ES DEMASIADO CORTO (posible falla de IA)
    if (textoLimpio.length < 50) {
      console.warn('⚠️ RESPUESTA DE IA MUY CORTA, PODRÍA HABER FALLADO');
      console.log('🔄 CONSIDERANDO USAR SISTEMA LOCAL COMO FALLBACK');
    }
    
    return textoLimpio;
  }

  // 🏠 FUNCIÓN LOCAL PARA GENERAR REPORTES SIN IA
  private generarReporteLocal(context: ReporteContext): string {
    console.log('🏠 ========== USANDO SISTEMA LOCAL (SIN IA) ==========');
    console.log('🚨 ATENCIÓN: Este reporte NO fue generado por IA');
    console.log('🔄 Usando transformaciones locales predefinidas');
    
    const { textoInformal, mantenimiento } = context;
    
    console.log('📝 Texto informal a procesar:', textoInformal);
    
    // Generar descripción técnica usando el procesador local
    const reporteGenerado = this.procesarTextoInformalAParagrafo(textoInformal, mantenimiento.descripcion);
    
    console.log('✅ REPORTE GENERADO POR SISTEMA LOCAL:', reporteGenerado);
    console.log('🎯 FORMATEANDO REPORTE CON DATOS LOCALES');

    const reporteFinal = this.formatearReporteFinal(context, reporteGenerado);
    console.log('🏆 REPORTE FINAL COMPLETADO - FUENTE: SISTEMA LOCAL (SIN IA)');
    console.log('🏠 ================================================');
    
    return reporteFinal;
  }
}

export const aiReporteService = new AIReporteService(); 