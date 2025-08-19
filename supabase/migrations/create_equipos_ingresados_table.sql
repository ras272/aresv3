-- Crear tabla equipos_ingresados
CREATE TABLE IF NOT EXISTS public.equipos_ingresados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigoIngreso VARCHAR(50) UNIQUE NOT NULL,
  fechaIngreso DATE NOT NULL,
  horaIngreso TIME NOT NULL,
  clienteOrigen VARCHAR(255) NOT NULL,
  contactoCliente VARCHAR(255) NOT NULL,
  telefonoContacto VARCHAR(50),
  equipoNombre VARCHAR(255) NOT NULL,
  equipoMarca VARCHAR(255) NOT NULL,
  equipoModelo VARCHAR(255),
  equipoSerie VARCHAR(255),
  problemaReportado TEXT NOT NULL,
  estadoVisualEquipo TEXT,
  accesoriosIncluidos TEXT,
  observacionesIngreso TEXT,
  estadoIngreso VARCHAR(50) NOT NULL DEFAULT 'Recién llegado',
  prioridadReparacion VARCHAR(50) NOT NULL DEFAULT 'Media',
  ticketMantenimientoId UUID,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_equipos_ingresados_codigo ON public.equipos_ingresados(codigoIngreso);
CREATE INDEX IF NOT EXISTS idx_equipos_ingresados_cliente ON public.equipos_ingresados(clienteOrigen);
CREATE INDEX IF NOT EXISTS idx_equipos_ingresados_estado ON public.equipos_ingresados(estadoIngreso);
CREATE INDEX IF NOT EXISTS idx_equipos_ingresados_prioridad ON public.equipos_ingresados(prioridadReparacion);
CREATE INDEX IF NOT EXISTS idx_equipos_ingresados_fecha ON public.equipos_ingresados(fechaIngreso DESC);

-- Crear función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updatedAt
DROP TRIGGER IF EXISTS update_equipos_ingresados_updated_at ON public.equipos_ingresados;
CREATE TRIGGER update_equipos_ingresados_updated_at
  BEFORE UPDATE ON public.equipos_ingresados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.equipos_ingresados ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Enable all operations for authenticated users" ON public.equipos_ingresados
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentarios en las columnas para documentación
COMMENT ON TABLE public.equipos_ingresados IS 'Tabla para registrar equipos que ingresan al servicio técnico';
COMMENT ON COLUMN public.equipos_ingresados.codigoIngreso IS 'Código único de ingreso en formato ING-YYYYMMDD-XXX';
COMMENT ON COLUMN public.equipos_ingresados.estadoIngreso IS 'Estados: Recién llegado, En diagnóstico, En reparación, Esperando repuestos, Listo para entrega, Entregado';
COMMENT ON COLUMN public.equipos_ingresados.prioridadReparacion IS 'Prioridad: Baja, Media, Alta, Crítica';
