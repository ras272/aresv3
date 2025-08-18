import { logger } from "../utils/logger";

export interface MessageInfo {
  isServiceRequest: boolean;
  cliente?: string | undefined;
  problema?: string | undefined;
  prioridad: "Baja" | "Media" | "Alta" | "Crítica";
  telefono?: string | undefined;
  equipoInfo?: string | undefined;
  componenteInfo?: string | undefined;
}

export class MessageProcessor {
  private static readonly PROBLEM_KEYWORDS = [
    // Palabras correctas
    "problema",
    "falla",
    "error",
    "no funciona",
    "no enciende",
    "roto",
    "dañado",
    "urgente",
    "ayuda",
    "emergencia",
    "crítico",
    "parado",
    "revisar",
    "importante",
    "necesito",
    "requiere",
    "favor",
    "pronto",
    "rápido",
    "no prende",
    "no arranca",
    "no responde",
    "descompuesto",

    // Palabras mal escritas comunes
    "problemas",
    "fallas",
    "errores",
    "no funca",
    "no funciona",
    "no ensciende",
    "no enciende",
    "rotto",
    "dañao",
    "urgentee",
    "urjente",
    "ayudaa",
    "emergenscia",
    "critico",
    "paradoo",
    "revisar",
    "importantee",
    "nesecito",
    "necesito",
    "rekiere",
    "fabor",
    "prontoo",
    "rapido",
    "no prende",
    "no arranca",
    "no responde",
    "descompuesto",

    // Jerga y coloquialismos
    "se jodio",
    "se cago",
    "se rompio",
    "no va",
    "no anda",
    "no sirve",
    "esta mal",
    "no camina",
    "muerto",
    "kaput",
    "frito",
    "quemado",
    "pinchado",
    "jodido",
    "cagado",
    "hecho mierda",
    "para el orto",
    "no tira",
    "no levanta",

    // Variaciones de urgencia
    "ya",
    "ahora",
    "rapido",
    "urgentisimo",
    "super urgente",
    "re urgente",
    "emergencia",
    "SOS",
    "help",
    "auxilio",
    "por favor",
    "porfavor",
    "x favor",

    // Expresiones paraguayas/regionales
    "no pyta",
    "esta jodido",
    "no sirve nada",
    "esta para tirar",
    "no da mas",
    "esta hecho bolsa",
    "no funciona ni a palos",
    "esta muerto",
    "no hay caso",

    // Abreviaciones de WhatsApp
    "pq",
    "xq",
    "x",
    "q",
    "k",
    "tmb",
    "tb",
    "pls",
    "plz",
    "pliss",
    "urge",
    "urg",
    "emerg",
    "prob",
    "falla",
    "err",
    "ayud",
  ];

  private static readonly CRITICAL_KEYWORDS = [
    // Urgencia correcta
    "urgente",
    "crítico",
    "emergencia",
    "parado",
    "no funciona",
    "no enciende",
    "roto",
    "dañado",
    "inmediato",
    "ya",

    // Urgencia mal escrita
    "urjente",
    "urgentee",
    "critico",
    "emergenscia",
    "paradoo",
    "no funca",
    "no ensciende",
    "rotto",
    "dañao",
    "inmediatoo",
    "yaa",

    // Jerga crítica
    "se jodio",
    "se cago",
    "se rompio",
    "muerto",
    "frito",
    "quemado",
    "kaput",
    "jodido",
    "cagado",
    "hecho mierda",
    "para el orto",
    "no tira",
    "no levanta",
    "no pyta",
    "esta jodido",
    "no sirve nada",
    "esta para tirar",
    "no da mas",
    "esta hecho bolsa",
    "no funciona ni a palos",
    "esta muerto",
    "no hay caso",

    // Expresiones de urgencia
    "urgentisimo",
    "super urgente",
    "re urgente",
    "SOS",
    "help",
    "auxilio",
    "ahora mismo",
    "ya mismo",
    "rapidisimo",
    "volando",
    "corriendo",
    "ahora",
    "grave",
    "no prende",
    "no arranca",
    "no responde",
    "descompuesto",
  ];

  private static readonly HIGH_PRIORITY_KEYWORDS = [
    // Palabras correctas
    "importante",
    "pronto",
    "rápido",
    "necesito",
    "requiere",
    "solicito",
    "favor",
    "ayuda",
    "error",

    // Palabras mal escritas
    "importantee",
    "importnte",
    "prontoo",
    "rapido",
    "rapidoo",
    "nesecito",
    "necesito",
    "rekiere",
    "solicitto",
    "fabor",
    "favor",
    "ayudaa",
    "ayud",
    "eror",
    "herror",

    // Jerga y coloquialismos
    "porfa",
    "porfavor",
    "x favor",
    "xfavor",
    "pls",
    "plz",
    "pliss",
    "please",
    "che ayuda",
    "ayudame",
    "ayudanos",
    "dale",
    "veni",
    "anda",
    "fijate",

    // Expresiones de necesidad
    "me urge",
    "lo necesito",
    "preciso",
    "tengo que",
    "debo",
    "hay que",
    "no puedo",
    "no se puede",
    "imposible",
    "no da",
    "no hay forma",
  ];

  private static readonly MEDIUM_PRIORITY_KEYWORDS = [
    // Palabras correctas
    "falla",
    "revisar",
    "verificar",
    "chequear",
    "controlar",
    "mirar",
    "ver",

    // Palabras mal escritas
    "faya",
    "fallas",
    "revisar",
    "verificar",
    "chekear",
    "checar",
    "controlar",
    "mirar",
    "ber",

    // Jerga técnica
    "checkear",
    "testear",
    "probar",
    "evaluar",
    "diagnosticar",
    "inspeccionar",
    "chekiar",
    "testiar",
    "prover",
    "evaluar",
    "diagnosticar",
    "inspeccionar",

    // Expresiones coloquiales
    "fijate",
    "mira",
    "ve",
    "anda a ver",
    "dale una mirada",
    "echale un ojo",
    "revisalo",
    "controlalo",
    "chequealo",
    "probalo",
  ];

  private static readonly LOW_PRIORITY_KEYWORDS = [
    // Expresiones de baja prioridad
    "cuando puedas",
    "no es urgente",
    "sin apuro",
    "consulta sobre",
    "pregunta sobre",
    "información sobre",
    "cuando tengas tiempo",
    "no hay apuro",
    "tranquilo",
    "despacio",
    "sin prisa",

    // Variaciones mal escritas
    "cuando puedas",
    "no es urjente",
    "sin apurro",
    "consultta",
    "pregunta",
    "informacion",
    "cuando tengas tienpo",
    "no ai apuro",
    "trankilo",
    "despasio",
    "sin prisa",

    // Expresiones coloquiales
    "nomas",
    "no mas",
    "cuando quieras",
    "si podes",
    "si tenes tiempo",
    "mas tarde",
    "otro dia",
    "mañana",
    "la semana que viene",
    "cuando sea",
    "no importa cuando",

    // Consultas generales
    "queria saber",
    "me gustaria saber",
    "tengo una duda",
    "una pregunta",
    "consulta",
    "keria saber",
    "me gustaria saver",
    "tengo una duda",
    "una pregunta",
    "consultta",
  ];

  private static readonly CLIENT_PATTERNS = [
    // Patrones formales
    /(?:clínica|clinica|hospital|centro|consultorio)\s+([a-záéíóúñ\s]+)/i,
    /(?:cliente|paciente)\s+([a-záéíóúñ\s]+)/i,
    /(?:dr\.?|dra\.?|doctor|doctora|doc)\s+([a-záéíóúñ\s]+)/i,

    // ARES - Patrones específicos (ALTA PRIORIDAD)
    /(ares\s+paraguay(?:\s+srl)?)/i,
    /(?:de|del|en)\s+(ares(?:\s+paraguay)?(?:\s+srl)?)/i,
    /\b(ares)\b/i, // "ares" como palabra independiente

    // Empresas con sufijos
    /([a-záéíóúñ\s]+)\s+(?:srl|sa|ltda|s\.a\.|s\.r\.l\.)/i,
    /(?:empresa|compañía|corporación)\s+([a-záéíóúñ\s]+)/i,

    // Nombres específicos (correctos y mal escritos)
    /(?:de|del|en)\s+(bibolini|biboliny|bivolini|martinez|martines|rodriguez|rodrigues|gonzalez|gonzales|lopez|lopes|garcia|garsia)/i,
    /(bibolini|biboliny|bivolini|martinez|martines|rodriguez|rodrigues|gonzalez|gonzales|lopez|lopes|garcia|garsia)/i,

    // Variaciones coloquiales
    /(?:del|de|en)\s+(norte|sur|este|oeste|centro|san\s+roque|santa\s+rita)/i,
    /(norte|sur|este|oeste|centro|san\s+roque|santa\s+rita)/i,

    // Jerga paraguaya
    /(?:del|de|en)\s+(che|kure|hermano|amigo|compadre)/i,
  ];

  private static readonly EQUIPMENT_PATTERNS = [
    // ND-Elite (todas las variaciones)
    /(nd-elite|nd\s*elite|ndelite|nd\s*elyte|n\s*d\s*elite)/i,

    // Ultraformer (NUEVO - ALTA PRIORIDAD)
    /(ultraformer|ultra\s*former|ultraformer\s*mpt)/i,

    // Hydrafacial (variaciones)
    /(hydrafacial|hidrafacial|hydra\s*facial|hidra\s*facial)/i,

    // HIFU (variaciones)
    /(hifu|hi\s*fu|hyfu|haifu)/i,

    // Láser (variaciones)
    /(láser|laser|lazer|lasser|laser)/i,

    // Equipos genéricos
    /(?:equipo|maquina|máquina|aparato|maquinita)\s+(?:de\s+)?([a-záéíóúñ\s]+)/i,

    // Otros equipos específicos
    /(ultrasonido|ultra\s*sonido|ultrasonico)/i,
    /(radiofrecuencia|radio\s*frecuencia|rf)/i,
    /(criolipolisis|crio\s*lipolisis|cryo)/i,
    /(cavitación|cavitacion|cavi)/i,
    /(nd\s*yag|ndyag)/i,
    /(ipl|luz\s*pulsada)/i,
    /(co2|dioxido)/i,

    // Equipos mal escritos comunes
    /(hidrafeisial|hydrafeisial|ydrafacial)/i,
    /(yfu|jifu|aifu)/i,
    /(lasser|lacer|leiser)/i,

    // Marcas y modelos
    /(alma|candela|syneron|lumenis|fotona)/i,
    /(soprano|lightsheer|coolsculpting|thermage)/i,
  ];

  private static readonly COMPONENT_PATTERNS = [
    // Pieza de mano (todas las variaciones)
    /(pieza\s+de\s+mano|paleta|handpiece|hand\s*piece|punta|aplicador)/i,
    /(piesa\s+de\s+mano|paletta|paleta|puntta|aplicador)/i,

    // Unidad principal
    /(unidad\s+principal|base|consola|torre|gabinete|caja)/i,
    /(unida\s+principal|vase|consolla|torre|gavete)/i,

    // Conexiones
    /(manguera|tubo|cable|conector|conexion|conexión)/i,
    /(manguerra|tuvo|cavle|conector|conexion)/i,

    // Filtros y cartuchos
    /(filtro|cartucho|repuesto|consumible)/i,
    /(filtro|cartucho|repuesto|consumivle)/i,

    // Pantallas y displays
    /(pantalla|display|monitor|screen|lcd)/i,
    /(pantaya|displei|monitor|pantalla)/i,

    // Partes mecánicas
    /(bomba|motor|ventilador|fan|cooler)/i,
    /(vonba|motor|ventilador|fan|culer)/i,

    // Sensores y sondas
    /(sensor|sonda|detector|medidor)/i,
    /(censor|sonda|detector|medidor)/i,

    // Componentes específicos por jerga
    /(la\s+cosa|el\s+chisme|la\s+parte|el\s+aparatito)/i,
    /(esa\s+cosa|ese\s+chisme|esa\s+parte|ese\s+aparato)/i,

    // Componentes eléctricos
    /(fuente|transformador|placa|circuito|board)/i,
    /(fuente|transformador|placa|sircuito|bord)/i,
  ];

  /**
   * Procesar mensaje para determinar si es una solicitud de servicio
   */
  static processMessage(
    messageText: string,
    senderPhone?: string
  ): MessageInfo {
    const text = messageText.toLowerCase().trim();

    logger.debug("Processing message", {
      messageLength: messageText.length,
      senderPhone: senderPhone?.substring(0, 8) + "***",
    });

    // Verificar si es una solicitud de servicio
    const isServiceRequest = this.isServiceRequest(text);

    if (!isServiceRequest) {
      return {
        isServiceRequest: false,
        prioridad: "Baja",
      };
    }

    // Extraer información del mensaje
    const cliente = this.extractClient(messageText);
    const problema = this.extractProblem(messageText);
    const prioridad = this.determinePriority(text);
    const equipoInfo = this.extractEquipment(messageText);
    const componenteInfo = this.extractComponent(messageText);

    logger.info("Service request detected", {
      cliente,
      problema: problema?.substring(0, 50) + "...",
      prioridad,
      equipoInfo,
      componenteInfo,
      hasPhone: !!senderPhone,
    });

    return {
      isServiceRequest: true,
      cliente,
      problema,
      prioridad,
      telefono: senderPhone,
      equipoInfo,
      componenteInfo,
    };
  }

  /**
   * Determinar si el mensaje es una solicitud de servicio
   */
  private static isServiceRequest(text: string): boolean {
    return this.PROBLEM_KEYWORDS.some((keyword) => text.includes(keyword));
  }

  /**
   * Extraer nombre del cliente del mensaje
   */
  private static extractClient(text: string): string | undefined {
    for (const pattern of this.CLIENT_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let cliente = match[1].trim();
        // Limpiar y capitalizar
        cliente = cliente.replace(/\s+/g, " ").trim();
        return this.capitalizeWords(cliente);
      }
    }
    return undefined;
  }

  /**
   * Capitalizar palabras correctamente
   */
  private static capitalizeWords(text: string): string {
    return text.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Extraer descripción del problema
   */
  private static extractProblem(text: string): string {
    // Limpiar el texto y tomar las primeras líneas relevantes
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    // Tomar hasta 3 líneas o 200 caracteres, lo que sea menor
    let problem = lines.slice(0, 3).join(" ").substring(0, 200);

    // Si es muy corto, usar todo el mensaje
    if (problem.length < 20) {
      problem = text.substring(0, 200);
    }

    return problem.trim();
  }

  /**
   * Extraer información de equipos del mensaje
   */
  private static extractEquipment(text: string): string | undefined {
    for (const pattern of this.EQUIPMENT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        let equipo = match[1] ? match[1].trim() : match[0].trim();
        // Limpiar y capitalizar
        equipo = equipo.replace(/\s+/g, " ").trim();
        return this.capitalizeWords(equipo);
      }
    }
    return undefined;
  }

  /**
   * Extraer información de componentes del mensaje
   */
  private static extractComponent(text: string): string | undefined {
    for (const pattern of this.COMPONENT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        let componente = match[1] ? match[1].trim() : match[0].trim();
        // Limpiar y capitalizar
        componente = componente.replace(/\s+/g, " ").trim();
        return this.capitalizeWords(componente);
      }
    }
    return undefined;
  }

  /**
   * Determinar prioridad basada en palabras clave y contexto
   */
  private static determinePriority(
    text: string
  ): "Baja" | "Media" | "Alta" | "Crítica" {
    const lowerText = text.toLowerCase();

    // Verificar palabras de baja prioridad primero
    if (
      this.LOW_PRIORITY_KEYWORDS.some((keyword) => lowerText.includes(keyword))
    ) {
      return "Baja";
    }

    // Verificar crítico (palabras exactas o con separadores)
    if (
      this.CRITICAL_KEYWORDS.some(
        (keyword) =>
          lowerText.includes(keyword) ||
          new RegExp(`\\b${keyword}\\b`, "i").test(lowerText)
      )
    ) {
      return "Crítica";
    }

    // Verificar alta prioridad (palabras exactas o con separadores)
    if (
      this.HIGH_PRIORITY_KEYWORDS.some(
        (keyword) =>
          lowerText.includes(keyword) ||
          new RegExp(`\\b${keyword}[:\\s]`, "i").test(lowerText) ||
          new RegExp(`\\b${keyword}\\b`, "i").test(lowerText)
      )
    ) {
      return "Alta";
    }

    // Lógica adicional para determinar prioridad
    const problemCount = this.PROBLEM_KEYWORDS.filter((k) =>
      lowerText.includes(k)
    ).length;
    const hasMultipleProblems = problemCount > 1;
    const isLongMessage = text.length > 150;
    const hasCapitalLetters = /[A-Z]{3,}/.test(text); // Palabras en mayúsculas (indica urgencia)
    const hasMediumKeywords = this.MEDIUM_PRIORITY_KEYWORDS.some((keyword) =>
      lowerText.includes(keyword)
    );

    // Si tiene múltiples indicadores de urgencia
    if ((hasMultipleProblems && isLongMessage) || hasCapitalLetters) {
      return "Alta";
    }

    // Si tiene palabras de prioridad media o es un mensaje detallado
    if (hasMediumKeywords || isLongMessage || hasMultipleProblems) {
      return "Media";
    }

    // Por defecto, prioridad media para solicitudes de servicio
    return "Media";
  }

  /**
   * Generar número de ticket limpio
   */
  static generateTicketNumber(ticketId: string): string {
    // Tomar los últimos 8 caracteres del UUID y convertir a número
    const shortId = ticketId.replace(/-/g, "").slice(-8);
    const numericId = (parseInt(shortId, 16) % 9999) + 1;
    return `TKT-${numericId.toString().padStart(4, "0")}`;
  }

  /**
   * Generar respuesta automática para el grupo
   */
  static generateGroupResponse(
    ticketId: string,
    messageInfo: MessageInfo,
    equipoEncontrado?: string
  ): string {
    const { cliente, prioridad, equipoInfo, componenteInfo } = messageInfo;

    const prioridadEmoji = {
      Crítica: "🚨",
      Alta: "⚠️",
      Media: "🔧",
      Baja: "📝",
    };

    const ticketNumber = this.generateTicketNumber(ticketId);
    // Priorizar equipo encontrado en BD, sino usar el detectado
    const equipoFinal = equipoEncontrado || equipoInfo || "Por definir";

    // Construir línea de equipo/componente
    let equipoLinea = `🔧 Equipo: ${equipoFinal}`;
    if (componenteInfo) {
      equipoLinea += `\n🔩 Componente: ${componenteInfo}`;
    }

    return `✅ Ticket ${ticketNumber} creado

🏢 Cliente: ${cliente || "Por definir"}
${equipoLinea}
${prioridadEmoji[prioridad]} Prioridad: ${prioridad}
👨‍🔧 Técnico: Javier Lopez

Javier será notificado automáticamente.`;
  }

  /**
   * Generar notificación privada para Javier
   */
  static generateJavierNotification(
    ticketId: string,
    messageInfo: MessageInfo,
    equipoEncontrado?: string
  ): string {
    const {
      cliente,
      problema,
      prioridad,
      telefono,
      equipoInfo,
      componenteInfo,
    } = messageInfo;

    const urgencyText = prioridad === "Crítica" ? "🚨 URGENTE - " : "";
    const ticketNumber = this.generateTicketNumber(ticketId);
    const equipoFinal = equipoEncontrado || equipoInfo || "Equipo por definir";

    // Construir líneas de equipo/componente
    let equipoLineas = `🔧 Equipo: ${equipoFinal}`;
    if (componenteInfo) {
      equipoLineas += `\n🔩 Componente: ${componenteInfo}`;
    }

    return `${urgencyText}Nuevo ticket ${ticketNumber}

🏢 Cliente: ${cliente || "Cliente desde WhatsApp"}
${equipoLineas}
${telefono ? `📱 Teléfono: ${telefono}` : ""}
⚠️ Prioridad: ${prioridad}

📝 Problema: ${problema}

${
  prioridad === "Crítica"
    ? "⚡ Requiere atención inmediata."
    : "✅ Responde cuando puedas atender."
}`;
  }
}
