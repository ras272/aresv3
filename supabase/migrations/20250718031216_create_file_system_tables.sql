-- Crear tabla para carpetas/directorios
CREATE TABLE IF NOT EXISTS carpetas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  ruta_completa TEXT NOT NULL UNIQUE,
  carpeta_padre_id UUID REFERENCES carpetas(id) ON DELETE CASCADE,
  departamento VARCHAR(100) NOT NULL, -- RRHH, Contabilidad, Servicio Técnico, etc.
  descripcion TEXT,
  icono VARCHAR(50) DEFAULT 'folder',
  color VARCHAR(20) DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla para archivos
CREATE TABLE IF NOT EXISTS archivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  nombre_original VARCHAR(255) NOT NULL,
  extension VARCHAR(10) NOT NULL,
  tamaño INTEGER NOT NULL,
  tipo_mime VARCHAR(100) NOT NULL,
  carpeta_id UUID NOT NULL REFERENCES carpetas(id) ON DELETE CASCADE,
  ruta_storage TEXT NOT NULL, -- Ruta en Supabase Storage
  url_publica TEXT,
  es_editable BOOLEAN DEFAULT FALSE, -- Si es Excel/CSV editable
  version INTEGER DEFAULT 1,
  checksum VARCHAR(64), -- Para detectar cambios
  metadatos JSONB DEFAULT '{}', -- Metadatos adicionales
  subido_por UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla para versiones de archivos (historial)
CREATE TABLE IF NOT EXISTS versiones_archivo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  archivo_id UUID NOT NULL REFERENCES archivos(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tamaño INTEGER NOT NULL,
  ruta_storage TEXT NOT NULL,
  checksum VARCHAR(64),
  comentario TEXT,
  creado_por UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla para permisos de carpetas
CREATE TABLE IF NOT EXISTS permisos_carpeta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carpeta_id UUID NOT NULL REFERENCES carpetas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  rol_usuario VARCHAR(50), -- admin, gerente, vendedor, tecnico, cliente
  puede_leer BOOLEAN DEFAULT TRUE,
  puede_escribir BOOLEAN DEFAULT FALSE,
  puede_eliminar BOOLEAN DEFAULT FALSE,
  puede_compartir BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla para actividad de archivos (log)
CREATE TABLE IF NOT EXISTS actividad_archivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  archivo_id UUID REFERENCES archivos(id) ON DELETE CASCADE,
  carpeta_id UUID REFERENCES carpetas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES user_profiles(id),
  accion VARCHAR(50) NOT NULL, -- crear, editar, eliminar, mover, compartir, descargar
  descripcion TEXT,
  ip_address INET,
  user_agent TEXT,
  metadatos JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_carpetas_ruta ON carpetas(ruta_completa);
CREATE INDEX IF NOT EXISTS idx_carpetas_departamento ON carpetas(departamento);
CREATE INDEX IF NOT EXISTS idx_archivos_carpeta ON archivos(carpeta_id);
CREATE INDEX IF NOT EXISTS idx_archivos_nombre ON archivos(nombre);
CREATE INDEX IF NOT EXISTS idx_versiones_archivo ON versiones_archivo(archivo_id, version);
CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON actividad_archivos(created_at);

-- Crear carpetas base del sistema ARES
INSERT INTO carpetas (nombre, ruta_completa, departamento, descripcion, icono, color) VALUES
('RRHH', '/RRHH', 'RRHH', 'Recursos Humanos - Planillas, contratos y documentos de empleados', 'users', '#10B981'),
('Contabilidad', '/Contabilidad', 'Contabilidad', 'Documentos contables, facturas y balances', 'calculator', '#8B5CF6'),
('Servicio Técnico', '/Servicio Técnico', 'Servicio Técnico', 'Reportes técnicos, manuales y documentación de equipos', 'wrench', '#F59E0B'),
('Inventario', '/Inventario', 'Inventario', 'Control de stock, compras y movimientos', 'package', '#EF4444'),
('Facturación', '/Facturación', 'Facturación', 'Facturas emitidas y documentos fiscales', 'receipt', '#3B82F6'),
('Documentos Generales', '/Documentos Generales', 'General', 'Documentos corporativos y generales', 'file-text', '#6B7280')
ON CONFLICT (ruta_completa) DO NOTHING;

-- Crear subcarpetas para RRHH
INSERT INTO carpetas (nombre, ruta_completa, carpeta_padre_id, departamento, descripcion) 
SELECT 
  'Planillas',
  '/RRHH/Planillas',
  c.id,
  'RRHH',
  'Planillas mensuales de sueldos'
FROM carpetas c WHERE c.ruta_completa = '/RRHH'
ON CONFLICT (ruta_completa) DO NOTHING;

INSERT INTO carpetas (nombre, ruta_completa, carpeta_padre_id, departamento, descripcion) 
SELECT 
  'Contratos',
  '/RRHH/Contratos',
  c.id,
  'RRHH',
  'Contratos de trabajo y documentos legales'
FROM carpetas c WHERE c.ruta_completa = '/RRHH'
ON CONFLICT (ruta_completa) DO NOTHING;

-- Crear subcarpetas para Contabilidad
INSERT INTO carpetas (nombre, ruta_completa, carpeta_padre_id, departamento, descripcion) 
SELECT 
  'Balances',
  '/Contabilidad/Balances',
  c.id,
  'Contabilidad',
  'Balances mensuales y anuales'
FROM carpetas c WHERE c.ruta_completa = '/Contabilidad'
ON CONFLICT (ruta_completa) DO NOTHING;

INSERT INTO carpetas (nombre, ruta_completa, carpeta_padre_id, departamento, descripcion) 
SELECT 
  'Facturas Recibidas',
  '/Contabilidad/Facturas Recibidas',
  c.id,
  'Contabilidad',
  'Facturas de proveedores y gastos'
FROM carpetas c WHERE c.ruta_completa = '/Contabilidad'
ON CONFLICT (ruta_completa) DO NOTHING;;
