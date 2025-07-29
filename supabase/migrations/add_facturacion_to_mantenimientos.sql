-- ===============================================
-- MIGRACIÓN: Agregar tracking de facturación externa a mantenimientos
-- ===============================================

-- Agregar columnas para trackear facturación externa
ALTER TABLE public.mantenimientos 
ADD COLUMN estado_facturacion VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado_facturacion IN ('Pendiente', 'Facturado', 'Enviado')),
ADD COLUMN numero_factura_externa VARCHAR(100),
ADD COLUMN fecha_facturacion DATE,
ADD COLUMN archivo_factura_pdf_nombre VARCHAR(255),
ADD COLUMN archivo_factura_pdf_url TEXT,
ADD COLUMN archivo_factura_pdf_tamaño INTEGER;

-- Agregar comentarios descriptivos
COMMENT ON COLUMN public.mantenimientos.estado_facturacion IS 'Estado del tracking de facturación externa (Pendiente/Facturado/Enviado)';
COMMENT ON COLUMN public.mantenimientos.numero_factura_externa IS 'Número de factura generada en el sistema externo';
COMMENT ON COLUMN public.mantenimientos.fecha_facturacion IS 'Fecha cuando se facturó en el sistema externo';
COMMENT ON COLUMN public.mantenimientos.archivo_factura_pdf_nombre IS 'Nombre del PDF de factura del sistema externo';
COMMENT ON COLUMN public.mantenimientos.archivo_factura_pdf_url IS 'URL del PDF de factura del sistema externo';
COMMENT ON COLUMN public.mantenimientos.archivo_factura_pdf_tamaño IS 'Tamaño del PDF de factura en bytes';

-- Crear índices para búsquedas
CREATE INDEX idx_mantenimientos_estado_facturacion ON public.mantenimientos(estado_facturacion);
CREATE INDEX idx_mantenimientos_numero_factura_externa ON public.mantenimientos(numero_factura_externa);

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'mantenimientos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;