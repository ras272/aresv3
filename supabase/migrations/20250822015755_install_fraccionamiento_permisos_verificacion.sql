-- Parte 6: PERMISOS Y VERIFICACIÓN FINAL

BEGIN;

-- Otorgar permisos para todas las funciones
GRANT EXECUTE ON FUNCTION public.procesar_ingreso_fraccionado(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_ingreso_fraccionado(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION public.abrir_caja_para_fraccionamiento(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.abrir_caja_para_fraccionamiento(UUID, TEXT, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION public.validar_disponibilidad_venta(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_disponibilidad_venta(UUID, INTEGER, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION public.procesar_venta_fraccionada(UUID, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_venta_fraccionada(UUID, INTEGER, TEXT, TEXT, TEXT) TO anon;

-- Comentarios en las funciones
COMMENT ON FUNCTION public.procesar_ingreso_fraccionado(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) IS 
'Procesa el ingreso de productos con capacidad de fraccionamiento al stock';

COMMENT ON FUNCTION public.abrir_caja_para_fraccionamiento(UUID, TEXT, TEXT) IS 
'Abre una caja completa para convertirla en unidades sueltas';

COMMENT ON FUNCTION public.validar_disponibilidad_venta(UUID, INTEGER, TEXT) IS 
'Valida si hay suficiente stock para una venta específica';

COMMENT ON FUNCTION public.procesar_venta_fraccionada(UUID, INTEGER, TEXT, TEXT, TEXT) IS 
'Procesa una venta fraccionada, manejando automáticamente la apertura de cajas si es necesario';

-- Comentarios en las columnas nuevas
COMMENT ON COLUMN stock_items.cajas_completas IS 'Número de cajas completas disponibles';
COMMENT ON COLUMN stock_items.unidades_sueltas IS 'Número de unidades sueltas (fuera de cajas)';
COMMENT ON COLUMN stock_items.unidades_por_paquete IS 'Número de unidades por caja/paquete';
COMMENT ON COLUMN stock_items.permite_fraccionamiento IS 'Indica si el producto puede ser fraccionado (venta por unidades)';

COMMENT ON VIEW v_stock_disponible_fraccionado IS 'Vista con información completa de stock incluyendo fraccionamiento';

COMMIT;;
