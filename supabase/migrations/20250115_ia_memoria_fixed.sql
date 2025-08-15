-- ===============================================
-- SISTEMA DE MEMORIA PARA IA CARTUCHERO - CORREGIDO
-- ===============================================

-- Tabla para almacenar la memoria de la IA
CREATE TABLE IF NOT EXISTS ia_memoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_memoria VARCHAR NOT NULL, -- 'conversacion', 'aprendizaje', 'contexto', 'patron'
  contenido JSONB NOT NULL, -- Contenido flexible de la memoria
  palabras_clave TEXT[], -- Para búsqueda rápida
  relevancia INTEGER DEFAULT 1, -- 1-10, qué tan importante es esta memoria
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_ultimo_acceso TIMESTAMP DEFAULT NOW(),
  veces_accedida INTEGER DEFAULT 0,
  usuario_origen VARCHAR, -- Quién generó esta memoria
  contexto_origen VARCHAR, -- De dónde viene (cartucho_consulta, stock_movimiento, etc.)
  activa BOOLEAN DEFAULT true
);

-- Tabla para conversaciones completas
CREATE TABLE IF NOT EXISTS ia_conversaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id VARCHAR NOT NULL, -- ID único de la sesión de chat
  usuario VARCHAR, -- Usuario que hizo la consulta
  consulta TEXT NOT NULL, -- Pregunta original
  respuesta TEXT NOT NULL, -- Respuesta de la IA
  contexto_usado JSONB, -- Qué datos usó para responder
  satisfaccion INTEGER, -- 1-5 si el usuario califica la respuesta
  fecha_consulta TIMESTAMP DEFAULT NOW(),
  duracion_procesamiento INTEGER, -- Milisegundos que tardó
  tokens_usados INTEGER, -- Para control de costos
  modelo_usado VARCHAR DEFAULT 'grok-beta'
);

-- Tabla para patrones aprendidos
CREATE TABLE IF NOT EXISTS ia_patrones_aprendidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patron_tipo VARCHAR NOT NULL, -- 'consulta_frecuente', 'problema_comun', 'flujo_trabajo'
  patron_descripcion TEXT NOT NULL,
  ejemplos JSONB, -- Ejemplos de este patrón
  frecuencia INTEGER DEFAULT 1, -- Cuántas veces se ha visto
  efectividad DECIMAL(3,2) DEFAULT 0.5, -- Qué tan efectivo es este patrón
  fecha_descubierto TIMESTAMP DEFAULT NOW(),
  fecha_ultima_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Tabla para conocimiento específico de cartuchos
CREATE TABLE IF NOT EXISTS ia_conocimiento_cartuchos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cartucho_serie VARCHAR, -- Número de serie del cartucho
  cartucho_id UUID, -- ID del cartucho en el sistema
  conocimiento_tipo VARCHAR NOT NULL, -- 'historial', 'problema', 'solucion', 'patron_uso'
  conocimiento JSONB NOT NULL, -- El conocimiento específico
  confianza DECIMAL(3,2) DEFAULT 0.5, -- Qué tan confiable es este conocimiento
  fuente VARCHAR, -- De dónde viene este conocimiento
  fecha_aprendido TIMESTAMP DEFAULT NOW(),
  validado BOOLEAN DEFAULT false -- Si ha sido validado por un humano
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_ia_memoria_palabras_clave ON ia_memoria USING GIN(palabras_clave);
CREATE INDEX IF NOT EXISTS idx_ia_memoria_tipo ON ia_memoria(tipo_memoria);
CREATE INDEX IF NOT EXISTS idx_ia_memoria_relevancia ON ia_memoria(relevancia DESC);
CREATE INDEX IF NOT EXISTS idx_ia_conversaciones_sesion ON ia_conversaciones(sesion_id);
CREATE INDEX IF NOT EXISTS idx_ia_conversaciones_fecha ON ia_conversaciones(fecha_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_ia_patrones_frecuencia ON ia_patrones_aprendidos(frecuencia DESC);
CREATE INDEX IF NOT EXISTS idx_ia_conocimiento_serie ON ia_conocimiento_cartuchos(cartucho_serie);

-- Comentarios para documentación
COMMENT ON TABLE ia_memoria IS 'Memoria persistente de la IA Cartuchero - almacena todo el conocimiento aprendido';
COMMENT ON TABLE ia_conversaciones IS 'Historial completo de todas las conversaciones con la IA';
COMMENT ON TABLE ia_patrones_aprendidos IS 'Patrones que la IA ha identificado y aprendido automáticamente';
COMMENT ON TABLE ia_conocimiento_cartuchos IS 'Conocimiento específico sobre cartuchos individuales';