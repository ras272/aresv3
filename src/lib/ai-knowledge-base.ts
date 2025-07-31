/**
 * 🧠 BASE DE CONOCIMIENTO PARA IA DE REPORTES TÉCNICOS
 * Contexto específico de Ares Paraguay para generar reportes profesionales
 */

export const ARES_KNOWLEDGE_BASE = {
  // 🏢 Información de la empresa
  empresa: {
    nombre: "Ares Paraguay",
    especialidad: "Servicio técnico de equipos médicos estéticos",
    certificaciones: ["ISO 9001", "Certificación ANVISA", "Registro SENASA"],
    experiencia: "15+ años en el mercado paraguayo",
    cobertura: "Todo Paraguay con base en Asunción"
  },

  // 🔧 Equipos que maneja Ares
  equipos: {
    "Ultraformer III": {
      fabricante: "Classys Inc.",
      tipo: "HIFU (High Intensity Focused Ultrasound)",
      aplicaciones: ["Lifting facial", "Reducción de grasa", "Tensado de piel"],
      componentes_criticos: ["Transductores", "Sistema de enfriamiento", "Pantalla táctil", "Fuente de poder"],
      mantenimiento_preventivo: "Cada 3 meses",
      problemas_comunes: ["Desgaste de transductores", "Sobrecalentamiento", "Calibración de potencia"]
    },
    "Criolipolisis CoolSculpting": {
      fabricante: "Zeltiq Aesthetics",
      tipo: "Sistema de criolipolisis",
      aplicaciones: ["Reducción de grasa localizada", "Contorno corporal"],
      componentes_criticos: ["Aplicadores", "Sistema de vacío", "Control de temperatura", "Bomba de refrigeración"],
      mantenimiento_preventivo: "Cada 2 meses",
      problemas_comunes: ["Pérdida de vacío", "Temperatura inconsistente", "Desgaste de aplicadores"]
    },
    "Láser Diodo 808nm": {
      fabricante: "Varios (Alma, Candela, etc.)",
      tipo: "Láser de depilación",
      aplicaciones: ["Depilación definitiva", "Tratamiento de lesiones vasculares"],
      componentes_criticos: ["Diodo láser", "Sistema de enfriamiento", "Pieza de mano", "Filtros"],
      mantenimiento_preventivo: "Mensual",
      problemas_comunes: ["Degradación del diodo", "Obstrucción de filtros", "Falla en enfriamiento"]
    },
    "Radiofrecuencia Monopolar": {
      fabricante: "Varios",
      tipo: "Sistema de radiofrecuencia",
      aplicaciones: ["Tensado de piel", "Reducción de celulitis", "Rejuvenecimiento facial"],
      componentes_criticos: ["Electrodos", "Generador RF", "Sistema de control", "Sensores de temperatura"],
      mantenimiento_preventivo: "Cada 6 semanas",
      problemas_comunes: ["Desgaste de electrodos", "Calibración de potencia", "Interferencia electromagnética"]
    }
  },

  // 🔍 Terminología técnica profesional
  terminologia: {
    diagnostico: [
      "Inspección visual detallada",
      "Verificación de parámetros operativos",
      "Análisis de rendimiento del sistema",
      "Evaluación de componentes críticos",
      "Pruebas de calibración",
      "Medición de valores de referencia"
    ],
    procedimientos: [
      "Desmontaje parcial del equipo",
      "Limpieza con solventes especializados",
      "Reemplazo de componentes desgastados",
      "Recalibración según especificaciones del fabricante",
      "Pruebas de funcionamiento post-servicio",
      "Verificación de parámetros de seguridad"
    ],
    herramientas: [
      "Multímetro digital Fluke",
      "Osciloscopio para análisis de señales",
      "Termómetro infrarrojo",
      "Kit de herramientas especializadas",
      "Solventes dieléctricos",
      "Equipos de calibración certificados"
    ]
  },

  // 📋 Plantillas de reportes por tipo de servicio
  plantillas: {
    mantenimiento_preventivo: {
      estructura: [
        "Inspección general del equipo",
        "Verificación de parámetros operativos",
        "Limpieza de componentes internos",
        "Lubricación de partes móviles",
        "Calibración de sistemas",
        "Pruebas de funcionamiento",
        "Recomendaciones de uso"
      ],
      conclusion_tipo: "El equipo se encuentra en condiciones óptimas para su operación continua."
    },
    reparacion_correctiva: {
      estructura: [
        "Diagnóstico de la falla reportada",
        "Identificación de componentes afectados",
        "Procedimiento de reparación ejecutado",
        "Reemplazo de piezas (si aplica)",
        "Pruebas de verificación",
        "Validación de funcionamiento",
        "Garantía del servicio"
      ],
      conclusion_tipo: "La falla ha sido corregida exitosamente y el equipo opera según especificaciones."
    },
    instalacion: {
      estructura: [
        "Verificación de condiciones del sitio",
        "Instalación según manual del fabricante",
        "Conexiones eléctricas y de datos",
        "Configuración inicial del sistema",
        "Calibración y puesta en marcha",
        "Capacitación al personal operativo",
        "Entrega de documentación técnica"
      ],
      conclusion_tipo: "El equipo ha sido instalado correctamente y está listo para operación."
    }
  },

  // ⚠️ Recomendaciones estándar
  recomendaciones: {
    generales: [
      "Mantener el equipo en ambiente controlado (temperatura 18-25°C, humedad <60%)",
      "Realizar limpieza externa diaria con paños suaves y productos no abrasivos",
      "Verificar conexiones eléctricas mensualmente",
      "Mantener registro de horas de operación",
      "Capacitar al personal en uso correcto del equipo"
    ],
    por_equipo: {
      "Ultraformer III": [
        "Reemplazar transductores cada 10,000 disparos aproximadamente",
        "Verificar sistema de enfriamiento semanalmente",
        "Calibrar potencia cada 6 meses con equipo certificado"
      ],
      "Criolipolisis": [
        "Verificar presión de vacío antes de cada sesión",
        "Limpiar filtros de aire mensualmente",
        "Revisar integridad de aplicadores después de cada uso"
      ]
    }
  },

  // 🛠️ Códigos de falla comunes
  codigos_falla: {
    "E001": "Falla en sistema de enfriamiento - Verificar bomba y filtros",
    "E002": "Sobrecalentamiento del sistema - Revisar ventilación",
    "E003": "Error de calibración - Recalibrar según manual",
    "E004": "Falla en sensor de temperatura - Reemplazar sensor",
    "E005": "Pérdida de vacío - Verificar mangueras y conexiones"
  }
};

/**
 * 🎯 EJEMPLOS DE REPORTES REALES PARA ENTRENAMIENTO
 * Estos son ejemplos del estilo que debe seguir la IA
 */
export const REPORTES_EJEMPLO = [
  {
    tipo: "mantenimiento_preventivo",
    equipo: "Ultraformer III",
    ejemplo: `
**REPORTE TÉCNICO - MANTENIMIENTO PREVENTIVO**

**Equipo:** Ultraformer III - Serie UF3-2024-001
**Cliente:** Clínica Estética Bella Vista
**Fecha:** ${new Date().toLocaleDateString()}
**Técnico:** Ing. Carlos Mendoza - Ares Paraguay

**PROCEDIMIENTOS EJECUTADOS:**

1. **Inspección General:**
   - Verificación visual del estado exterior del equipo
   - Revisión de integridad de cables y conexiones
   - Comprobación de estado de la pantalla táctil

2. **Mantenimiento del Sistema de Enfriamiento:**
   - Limpieza de filtros de aire con solvente dieléctrico
   - Verificación de presión del sistema (12.5 PSI - dentro de rango normal)
   - Prueba de funcionamiento de ventiladores internos

3. **Calibración de Transductores:**
   - Verificación de potencia de salida con medidor certificado
   - Transductor 4.5MHz: 98% de eficiencia (Excelente)
   - Transductor 7.0MHz: 95% de eficiencia (Bueno)
   - Transductor 10.0MHz: 92% de eficiencia (Aceptable)

4. **Pruebas de Funcionamiento:**
   - Test de todos los modos operativos
   - Verificación de sistema de seguridad
   - Comprobación de precisión en configuraciones

**OBSERVACIONES:**
El equipo presenta un excelente estado general. Los transductores muestran desgaste normal para las horas de operación registradas (2,847 horas). Se recomienda considerar reemplazo del transductor de 10MHz en los próximos 6 meses.

**RECOMENDACIONES:**
- Continuar con programa de mantenimiento cada 3 meses
- Monitorear temperatura ambiente (mantener entre 20-24°C)
- Capacitar personal en limpieza diaria de transductores

**PRÓXIMO MANTENIMIENTO:** Marzo 2025

**GARANTÍA:** 90 días sobre trabajos realizados

---
**Ares Paraguay - Servicio Técnico Especializado**
**Certificado ISO 9001 | 15 años de experiencia**
    `
  },
  {
    tipo: "reparacion_correctiva",
    equipo: "Criolipolisis",
    ejemplo: `
**REPORTE TÉCNICO - REPARACIÓN CORRECTIVA**

**Equipo:** CoolSculpting Elite - Serie CS-2023-045
**Cliente:** Centro Médico Estético Premium
**Fecha:** ${new Date().toLocaleDateString()}
**Técnico:** Ing. María González - Ares Paraguay

**FALLA REPORTADA:**
"El equipo no genera vacío suficiente en el aplicador grande, la sesión se interrumpe constantemente"

**DIAGNÓSTICO REALIZADO:**

1. **Análisis Inicial:**
   - Prueba de presión de vacío: 8.2 PSI (Normal: 12-15 PSI)
   - Inspección visual del sistema de mangueras
   - Verificación de integridad de aplicadores

2. **Identificación de la Causa:**
   - Fuga detectada en conexión principal del aplicador CoolMax
   - Desgaste en sello de goma del conector (P/N: CS-SEAL-001)
   - Acumulación de residuos en válvula de control

**PROCEDIMIENTO DE REPARACIÓN:**

1. **Desmontaje y Limpieza:**
   - Desconexión segura del sistema de vacío
   - Desmontaje del aplicador afectado
   - Limpieza profunda con solvente especializado

2. **Reemplazo de Componentes:**
   - Instalación de nuevo sello de goma (P/N: CS-SEAL-001)
   - Reemplazo de válvula de control (P/N: CS-VALVE-003)
   - Verificación de torque en conexiones (15 Nm)

3. **Pruebas de Verificación:**
   - Test de presión: 14.8 PSI (Excelente)
   - Prueba de funcionamiento continuo por 30 minutos
   - Verificación de todos los aplicadores

**RESULTADO:**
Falla corregida exitosamente. El equipo opera según especificaciones del fabricante. Sistema de vacío restaurado a parámetros normales.

**PIEZAS UTILIZADAS:**
- Sello de goma CS-SEAL-001 (Qty: 1)
- Válvula de control CS-VALVE-003 (Qty: 1)

**RECOMENDACIONES POST-SERVICIO:**
- Verificar presión de vacío semanalmente
- Limpiar aplicadores después de cada uso
- Programar mantenimiento preventivo en 60 días

**GARANTÍA:** 6 meses sobre piezas reemplazadas
**COSTO TOTAL:** Incluido en contrato de mantenimiento

---
**Ares Paraguay - Excelencia en Servicio Técnico**
**Soporte 24/7 | Técnicos certificados**
    `
  }
];