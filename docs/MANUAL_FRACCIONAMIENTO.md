# Manual del Sistema de Fraccionamiento de Productos

## 📦 Introducción

El sistema de fraccionamiento permite manejar productos que se compran en paquetes/cajas pero necesitan venderse tanto por paquete completo como por unidades individuales.

### Ejemplo Práctico: Hydralock
- **Ingreso**: 2 cajas (cada caja tiene 6 unidades)
- **Stock**: 2 cajas = 12 unidades disponibles
- **Ventas posibles**:
  - Por caja completa (6 unidades a la vez)
  - Por unidades individuales (1, 2, 3... unidades)

## 🔄 Flujo del Sistema

### 1. INGRESO DE MERCADERÍAS

Al registrar un nuevo producto en el sistema:

```javascript
// Componente: IngresoFraccionamiento.tsx
// Ubicación: src/components/IngresoFraccionamiento.tsx
```

**Campos importantes:**
- **Cantidad de Cajas/Paquetes**: Número de cajas que ingresan
- **Unidades por Caja**: Cuántas unidades tiene cada caja
- **Permitir fraccionamiento**: ✅ Marcar si se puede vender por unidades

#### Ejemplo de configuración:
```
Producto: Hydralock
Cantidad de Cajas: 2
Unidades por Caja: 6
✅ Permitir venta fraccionada
---
Total ingresado: 12 unidades (en 2 cajas)
```

### 2. VISUALIZACIÓN EN STOCK

El stock muestra la información de forma clara:

```javascript
// Componente: StockFraccionadoView.tsx
// Ubicación: src/components/StockFraccionadoView.tsx
```

**Vista del stock:**
- **Productos fraccionables**: Muestra cajas + unidades sueltas
- **Productos no fraccionables**: Muestra solo unidades totales

#### Ejemplo de visualización:
```
Hydralock
📦 2 cajas (6 u/caja)
📋 0 unidades sueltas
Total: 12 unidades
```

### 3. VENTA DESDE STOCK

```javascript
// Componente: VentaFraccionada.tsx
// Ubicación: src/components/VentaFraccionada.tsx
```

**Opciones de venta:**

#### A. Venta por Caja Completa
- Cliente solicita: 1 caja
- Sistema descuenta: 1 caja (6 unidades)
- Stock resultante: 1 caja + 0 unidades sueltas

#### B. Venta por Unidades
- Cliente solicita: 4 unidades
- Sistema:
  1. Verifica si hay unidades sueltas (0 en este caso)
  2. Abre automáticamente 1 caja (6 unidades)
  3. Descuenta 4 unidades
  4. Deja 2 unidades sueltas
- Stock resultante: 1 caja + 2 unidades sueltas

### 4. VENTA DESDE REMISIONES

En la página de remisiones, al agregar productos:

**Si el producto es fraccionable:**
- Se puede especificar tipo de unidad (caja/unidad)
- Se calcula automáticamente el total en unidades base
- Se valida disponibilidad antes de confirmar

## 🗄️ Base de Datos

### Tablas Modificadas

#### productos_carga
```sql
- unidades_por_paquete: INTEGER -- Unidades por caja
- permite_fraccionamiento: BOOLEAN -- Si permite venta fraccionada
- unidades_sueltas: INTEGER -- Unidades sueltas disponibles
```

#### stock_items
```sql
- cajas_completas: INTEGER -- Número de cajas completas
- unidades_sueltas: INTEGER -- Unidades fuera de cajas
- unidades_por_paquete: INTEGER -- Factor de conversión
- permite_fraccionamiento: BOOLEAN -- Si permite fraccionamiento
```

#### productos_remision
```sql
- tipo_unidad: VARCHAR -- 'caja' o 'unidad'
- factor_conversion: INTEGER -- Factor aplicado
- cantidad_unidades_base: INTEGER -- Total en unidades
```

### Funciones Disponibles

#### 1. procesar_ingreso_fraccionado
```sql
SELECT procesar_ingreso_fraccionado(
    p_producto_carga_id := 'uuid-del-producto',
    p_cantidad_cajas := 2,
    p_unidades_por_caja := 6,
    p_permite_fraccionamiento := true,
    p_usuario := 'Usuario'
);
```

#### 2. procesar_venta_fraccionada
```sql
SELECT procesar_venta_fraccionada(
    p_stock_item_id := 'uuid-del-item',
    p_cantidad_solicitada := 4,
    p_tipo_venta := 'unidad', -- o 'caja'
    p_usuario := 'Usuario',
    p_referencia := 'REM-001'
);
```

#### 3. validar_disponibilidad_venta
```sql
SELECT validar_disponibilidad_venta(
    p_stock_item_id := 'uuid-del-item',
    p_cantidad := 10,
    p_tipo_venta := 'unidad'
);
```

#### 4. abrir_caja_para_fraccionamiento
```sql
SELECT abrir_caja_para_fraccionamiento(
    p_stock_item_id := 'uuid-del-item',
    p_usuario := 'Usuario',
    p_motivo := 'Apertura manual'
);
```

### Vista Útil

```sql
-- Vista con stock formateado
SELECT * FROM v_stock_disponible_fraccionado;
```

## 🎯 Casos de Uso Comunes

### Caso 1: Producto nuevo con fraccionamiento
1. Ingreso: 5 cajas de 10 unidades c/u
2. Marcar "Permitir fraccionamiento"
3. Stock inicial: 5 cajas (50 unidades)

### Caso 2: Venta mixta
1. Stock inicial: 3 cajas + 5 unidades sueltas
2. Cliente pide: 20 unidades
3. Sistema toma: 5 unidades sueltas + abre 2 cajas (12 unidades) + 3 unidades de la tercera caja
4. Stock final: 1 caja + 3 unidades sueltas

### Caso 3: Apertura manual de caja
1. Stock: 2 cajas completas
2. Acción: Abrir 1 caja manualmente
3. Stock resultante: 1 caja + 6 unidades sueltas

## ⚠️ Consideraciones Importantes

1. **Trazabilidad**: Todos los movimientos quedan registrados en `movimientos_stock`
2. **Cajas abiertas**: Se registran en `stock_cajas_abiertas` para auditoría
3. **Validación**: El sistema valida disponibilidad antes de confirmar ventas
4. **Automatización**: Las cajas se abren automáticamente cuando es necesario

## 🔧 Configuración en la UI

### Para usar los componentes:

```tsx
// En tu página de ingreso
import { IngresoFraccionamiento } from '@/components/IngresoFraccionamiento';

<IngresoFraccionamiento
  productoCargaId={productId}
  productoNombre="Hydralock"
  cantidadInicial={2}
  onSuccess={handleSuccess}
/>

// En tu página de stock
import { StockFraccionadoView } from '@/components/StockFraccionadoView';

<StockFraccionadoView />

// Para venta individual
import { VentaFraccionada } from '@/components/VentaFraccionada';

<VentaFraccionada
  stockItemId={itemId}
  onSuccess={handleSuccess}
  onCancel={handleCancel}
/>
```

## 📊 Reportes y Consultas

### Stock actual con fraccionamiento
```sql
SELECT 
    nombre,
    marca,
    modelo,
    cajas_completas,
    unidades_sueltas,
    cajas_completas || ' cajas + ' || 
    unidades_sueltas || ' unidades' as stock_formateado,
    (cajas_completas * unidades_por_paquete) + unidades_sueltas as total_unidades
FROM stock_items
WHERE permite_fraccionamiento = true
ORDER BY nombre;
```

### Historial de cajas abiertas
```sql
SELECT 
    sca.*,
    si.nombre,
    si.marca
FROM stock_cajas_abiertas sca
JOIN stock_items si ON si.id = sca.stock_item_id
ORDER BY sca.fecha_apertura DESC;
```

### Movimientos de productos fraccionados
```sql
SELECT 
    fecha_movimiento,
    producto_nombre,
    tipo_movimiento,
    tipo_unidad_movimiento,
    cajas_afectadas,
    unidades_sueltas_afectadas,
    usuario_responsable,
    descripcion
FROM movimientos_stock
WHERE tipo_unidad_movimiento IN ('caja', 'unidad')
ORDER BY fecha_movimiento DESC;
```

## 🚀 Mejoras Futuras Sugeridas

1. **Precios diferenciados**: Precio por caja vs precio por unidad
2. **Alertas automáticas**: Notificar cuando quedan pocas cajas completas
3. **Preferencias de venta**: Configurar si preferir vender cajas completas primero
4. **Reportes avanzados**: Análisis de patrones de fraccionamiento
5. **Integración con facturación**: Mostrar tipo de unidad en facturas

## 📝 Notas de Implementación

- El sistema mantiene la consistencia entre las tres páginas principales
- Los triggers de base de datos aseguran la integridad de los datos
- La validación se hace tanto en frontend como en backend
- Los componentes son reutilizables y configurables

---

**Versión**: 1.0.0  
**Fecha**: Enero 2025  
**Autor**: Sistema AresTech Care
