# Sistema de Fraccionamiento - Instalación

## Descripción
El sistema de fraccionamiento permite manejar productos que pueden venderse tanto por cajas completas como por unidades individuales. Es ideal para farmacéuticas y distribuidoras que necesitan fraccionar productos de sus empaques originales.

## Características
- ✅ Manejo de cajas completas y unidades sueltas
- ✅ Apertura automática de cajas cuando es necesario
- ✅ Validación de disponibilidad antes de ventas
- ✅ Trazabilidad completa de movimientos
- ✅ Vista consolidada del stock fraccionado
- ✅ Triggers automáticos para mantener consistencia

## Instalación

### Opción 1: Script automático
Ejecutar el script principal que instala todo el sistema:

```sql
-- Conectar a la base de datos de Supabase
\i database/install_fraccionamiento.sql
```

### Opción 2: Instalación manual paso a paso

1. **Migrar la tabla stock_items**:
```sql
\i database/migrations/add_fraccionamiento_to_stock_items.sql
```

2. **Crear función de ingreso**:
```sql
\i database/functions/procesar_ingreso_fraccionado.sql
```

3. **Crear funciones auxiliares**:
```sql
\i database/functions/funciones_fraccionamiento.sql
```

## Funciones Disponibles

### `procesar_ingreso_fraccionado`
Procesa el ingreso de productos con capacidad de fraccionamiento.

**Parámetros:**
- `p_producto_carga_id` (UUID): ID del producto en la carga
- `p_cantidad_cajas` (INTEGER): Número de cajas a ingresar
- `p_unidades_por_caja` (INTEGER): Unidades por caja
- `p_permite_fraccionamiento` (BOOLEAN): Si permite fraccionamiento
- `p_usuario` (TEXT): Usuario que realiza la operación

**Ejemplo:**
```sql
SELECT procesar_ingreso_fraccionado(
    'uuid-del-producto'::UUID,
    10,  -- 10 cajas
    20,  -- 20 unidades por caja
    true, -- Permite fraccionamiento
    'Usuario Admin'
);
```

### `abrir_caja_para_fraccionamiento`
Abre una caja completa para convertirla en unidades sueltas.

**Parámetros:**
- `p_stock_item_id` (UUID): ID del item de stock
- `p_usuario` (TEXT): Usuario que realiza la operación
- `p_motivo` (TEXT): Motivo de la apertura

### `validar_disponibilidad_venta`
Valida si hay suficiente stock para una venta específica.

**Parámetros:**
- `p_stock_item_id` (UUID): ID del item de stock
- `p_cantidad` (INTEGER): Cantidad solicitada
- `p_tipo_venta` (TEXT): 'caja' o 'unidad'

### `procesar_venta_fraccionada`
Procesa una venta fraccionada con apertura automática de cajas.

**Parámetros:**
- `p_stock_item_id` (UUID): ID del item de stock
- `p_cantidad_solicitada` (INTEGER): Cantidad a vender
- `p_tipo_venta` (TEXT): 'caja' o 'unidad'
- `p_usuario` (TEXT): Usuario que realiza la venta
- `p_referencia` (TEXT): Referencia de la venta

## Nuevas Columnas en stock_items

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cajas_completas` | INTEGER | Número de cajas completas disponibles |
| `unidades_sueltas` | INTEGER | Número de unidades sueltas (fuera de cajas) |
| `unidades_por_paquete` | INTEGER | Número de unidades por caja/paquete |
| `permite_fraccionamiento` | BOOLEAN | Si el producto puede ser fraccionado |

## Vista: v_stock_disponible_fraccionado

Proporciona una vista consolidada del stock con información de fraccionamiento:
- Stock en formato legible
- Unidades totales calculadas
- Estado del stock (Disponible, Stock bajo, Sin stock)

```sql
SELECT * FROM v_stock_disponible_fraccionado 
WHERE permite_fraccionamiento = true;
```

## Ejemplos de Uso

### 1. Ingresar producto fraccionable
```sql
-- Ingresar 5 cajas de 24 unidades cada una
SELECT procesar_ingreso_fraccionado(
    (SELECT id FROM productos_carga WHERE nombre = 'Paracetamol 500mg' LIMIT 1),
    5,    -- 5 cajas
    24,   -- 24 unidades por caja
    true, -- Permite fraccionamiento
    'Farmacéutico Juan'
);
```

### 2. Vender por unidades (con apertura automática de cajas)
```sql
-- Vender 30 unidades (abrirá cajas automáticamente si es necesario)
SELECT procesar_venta_fraccionada(
    (SELECT id FROM stock_items WHERE nombre = 'Paracetamol 500mg' LIMIT 1),
    30,      -- 30 unidades
    'unidad', -- Tipo de venta
    'Vendedor María',
    'VENTA-001'
);
```

### 3. Vender cajas completas
```sql
-- Vender 2 cajas completas
SELECT procesar_venta_fraccionada(
    (SELECT id FROM stock_items WHERE nombre = 'Paracetamol 500mg' LIMIT 1),
    2,      -- 2 cajas
    'caja', -- Tipo de venta
    'Vendedor Carlos',
    'VENTA-002'
);
```

## Verificación de Instalación

Después de la instalación, verificar que todo funciona correctamente:

```sql
-- Verificar columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stock_items' 
AND column_name IN ('cajas_completas', 'unidades_sueltas', 'unidades_por_paquete', 'permite_fraccionamiento');

-- Verificar funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
    'procesar_ingreso_fraccionado',
    'abrir_caja_para_fraccionamiento',
    'validar_disponibilidad_venta',
    'procesar_venta_fraccionada'
);

-- Verificar vista
SELECT * FROM v_stock_disponible_fraccionado LIMIT 5;
```

## Troubleshooting

### Error: "Could not find the function procesar_ingreso_fraccionado"
**Solución:** Ejecutar el archivo de funciones:
```sql
\i database/functions/procesar_ingreso_fraccionado.sql
```

### Error: "column does not exist"
**Solución:** Ejecutar la migración de columnas:
```sql
\i database/migrations/add_fraccionamiento_to_stock_items.sql
```

### Los cálculos no se actualizan automáticamente
**Solución:** Verificar que el trigger esté activo:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trg_actualizar_cantidad_disponible';
```

## Soporte
Para problemas o dudas sobre el sistema de fraccionamiento, revisar los logs de la base de datos o contactar al equipo de desarrollo.
