# 📦 Módulo de Ingreso de Mercaderías - ACTUALIZADO - Ares Paraguay

## 🎯 Descripción

Sistema **completamente rediseñado** de gestión de cargas de mercaderías para Ares Paraguay. Ahora permite **múltiples productos por carga**, reflejando la realidad operativa donde una sola entrega puede incluir diferentes tipos de productos.

## ✨ **NUEVO:** Sistema de Cargas Múltiples

### 🔄 **Cambio Principal:**
- **ANTES:** 1 ingreso = 1 producto
- **AHORA:** 1 carga = múltiples productos de diferentes tipos

### 🚛 **Ejemplo Real de Carga:**
```typescript
ENTRADA-20241201-001: "Carga completa Classys"
├── 1x Equipo Ultraformer III (Equipo Médico)
│   ├── Transductor 4.5MHz
│   └── Transductor 7MHz
├── 50x Cartuchos DS-4.5 (Insumo)
└── 20x Gel Conductor (Insumo)
```

Todo bajo **un solo código de carga**, como en la vida real.

## 🔥 **Funcionalidades Principales**

### 📋 **Formulario de Carga Múltiple**
- **Información General**: Destino único y observaciones de la carga completa
- **Productos Dinámicos**: Agregar tantos productos como necesites
- **Tipos Mixtos**: Combina insumos, repuestos y equipos médicos
- **Subitems por Equipo**: Cada equipo médico puede tener sus propios componentes
- **Validación Inteligente**: Reglas específicas por tipo de producto

### 🏥 **Integración Automática**
- **Equipos Médicos**: Se envían automáticamente al módulo de Servicio Técnico
- **Múltiples Equipos**: Si hay varios equipos en la carga, todos se procesan
- **Preserva Relación**: Los subitems se convierten en componentes del equipo

### 📊 **Dashboard Mejorado**
- **Total Cargas**: Número de cargas registradas
- **Cargas Hoy**: Cargas del día actual
- **Total Productos**: Suma de todos los productos en todas las cargas
- **Equipos Médicos**: Contador de equipos enviados a Servicio Técnico

### 🔍 **Tabla Avanzada**
- **Vista Resumen**: Muestra información agregada por carga
- **Tipos por Carga**: Badges que indican cuántos productos de cada tipo
- **Búsqueda Global**: Busca en código, destino, productos, marcas, modelos
- **Detalle Expandible**: Vista completa de todos los productos de la carga

## 🛠️ **Tecnologías y Estructura**

### **Tipos TypeScript Actualizados:**
```typescript
interface CargaMercaderia {
  id: string;
  codigoCarga: string;
  fechaIngreso: string;
  destino: string;
  observacionesGenerales?: string;
  productos: ProductoCarga[];
  createdAt: string;
}

interface ProductoCarga {
  id: string;
  producto: string;
  tipoProducto: 'Insumo' | 'Repuesto' | 'Equipo Médico';
  marca: string;
  modelo: string;
  numeroSerie?: string;
  cantidad: number;
  observaciones?: string;
  imagen?: string;
  subitems?: SubItem[];
}
```

### **Validación Zod Mejorada:**
```typescript
export const cargaMercaderiaSchema = z.object({
  destino: z.string().min(1, 'El destino es obligatorio'),
  observacionesGenerales: z.string().optional(),
  productos: z.array(productoCargaSchema).min(1, 'Debe agregar al menos un producto'),
});
```

## 🚀 **Cómo Usar el Sistema Actualizado**

### 1. **Crear Nueva Carga**
1. Click en "Nueva Carga"
2. Llenar destino general (ej: "Hospital Central - Cardiología")
3. Agregar observaciones generales de la carga

### 2. **Agregar Productos**
- **Primer producto**: Ya viene uno por defecto
- **Más productos**: Click en "Agregar Producto"
- **Cada producto**: Completar información específica
- **Equipos médicos**: Automáticamente habilita sección de subitems

### 3. **Gestión de Subitems (Solo Equipos Médicos)**
- Click "Agregar Subitem" para componentes/accesorios
- Cada subitem: nombre, número de serie, cantidad
- Pueden ser: transductores, cables, electrodos, etc.

### 4. **Resultado Automático**
- **Código único** para toda la carga
- **Toast informativo** con resumen
- **Equipos médicos** → Servicio Técnico automáticamente
- **Vista en tabla** con información agregada

## 📋 **Ejemplo Completo de Flujo**

### **Carga Real: Equipamiento Classys**
```typescript
{
  destino: "Hospital Central - Cardiología",
  observacionesGenerales: "Carga completa de equipamiento Classys para ampliación del servicio",
  productos: [
    {
      // Producto 1: Equipo principal
      producto: "Equipo Ultraformer III",
      tipoProducto: "Equipo Médico",
      marca: "Classys",
      modelo: "Ultraformer III",
      numeroSerie: "CL-UF3-2024-001", // Obligatorio para equipos
      cantidad: 1,
      subitems: [
        { nombre: "Transductor 4.5MHz", numeroSerie: "CL-UF3-T45", cantidad: 1 },
        { nombre: "Transductor 7MHz", numeroSerie: "CL-UF3-T7", cantidad: 1 }
      ]
    },
    {
      // Producto 2: Consumibles
      producto: "Cartuchos para Ultraformer",
      tipoProducto: "Insumo",
      marca: "Classys",
      modelo: "Cartucho DS-4.5",
      numeroSerie: "CL-CART-DS45-LOTE001",
      cantidad: 50
    },
    {
      // Producto 3: Accesorios
      producto: "Gel Conductor Premium",
      tipoProducto: "Insumo",
      marca: "Classys",
      modelo: "Gel-Conductor-Premium",
      cantidad: 20
    }
  ]
}

// Resultado automático:
// ✅ Código: ENTRADA-20241201-001
// ✅ 3 productos registrados
// ✅ 1 equipo médico enviado a Servicio Técnico
// ✅ Subitems convertidos en componentes del equipo
```

## 📊 **Vista de Tabla Mejorada**

### **Columnas de la Tabla:**
- **Código de Carga**: Identificador único
- **Fecha**: Fecha de ingreso
- **Destino**: Ubicación de destino
- **Productos**: Cantidad total de productos
- **Tipos**: Badges con contadores por tipo
- **Equipos Médicos**: Indicador de equipos enviados

### **Detalle Expandible:**
- **Header**: Código, fecha, destino
- **Observaciones Generales**: Si las hay
- **Lista de Productos**: Cada producto con su información completa
- **Subitems**: Por cada equipo médico
- **Indicadores**: Equipos enviados a Servicio Técnico

## 🔄 **Integración con Servicio Técnico Mejorada**

```typescript
// Función actualizada
export const addEquipoAlServicioTecnico = (producto: ProductoCarga, carga: CargaMercaderia) => {
  // Convierte cada equipo médico de la carga
  // Preserva información de la carga original
  // Mapea subitems como componentes
  // Mantiene trazabilidad completa
}
```

### **Información Preservada:**
- Código de carga original
- Observaciones de la carga y del producto
- Fecha de ingreso
- Destino específico
- Todos los subitems como componentes

## 📁 **Archivos Actualizados**

```
src/
├── types/index.ts                     # CargaMercaderia, ProductoCarga
├── lib/schemas.ts                     # cargaMercaderiaSchema, productoCargaSchema  
├── store/useAppStore.ts               # addCargaMercaderia, getCargasMercaderia
├── app/mercaderias/page.tsx           # Dashboard con estadísticas actualizadas
└── components/mercaderias/
    ├── FormularioCarga.tsx            # Formulario para múltiples productos
    └── TablaCargas.tsx                # Tabla con vista agregada
```

## 🎯 **Beneficios del Nuevo Sistema**

### ✅ **Realismo Operativo**
- Refleja cómo realmente llegan las mercaderías
- Una sola carga puede tener múltiples productos
- Código único por carga, no por producto

### ✅ **Eficiencia**
- Menos códigos de carga
- Registro más rápido de cargas completas
- Mejor organización de la información

### ✅ **Flexibilidad**
- Mezcla tipos de productos en una carga
- Múltiples equipos médicos por carga
- Observaciones tanto generales como por producto

### ✅ **Trazabilidad**
- Relación clara entre productos de la misma carga
- Información de contexto preservada
- Historial completo de cada carga

## 🚦 **Estado Actual**

✅ **COMPLETADO:**
- Sistema de cargas múltiples
- Formulario dinámico para múltiples productos
- Validación por tipo de producto
- Integración automática con Servicio Técnico
- Dashboard con estadísticas actualizadas
- Tabla con vista agregada y detalle expandible
- Búsqueda en múltiples campos
- Datos de ejemplo representativos

## 🌟 **Casos de Uso Reales**

### **Caso 1: Carga Mixta Classys**
- 1x Ultraformer III + subitems
- 50x Cartuchos desechables
- 20x Gel conductor
- **Resultado**: 1 código de carga, 1 equipo en Servicio Técnico

### **Caso 2: Reposición UCI**
- 50x Filtros HEPA
- 10x Cables ECG de repuesto
- 5x Sensores SpO2
- **Resultado**: 1 código de carga, inventario organizado

### **Caso 3: Equipamiento Completo**
- 2x Monitores multiparamétricos
- 1x Desfibrilador
- Accesorios y repuestos varios
- **Resultado**: 1 código de carga, 3 equipos en Servicio Técnico

---

**🏥 Sistema actualizado para Ares Paraguay**  
*Gestión de cargas múltiples - Más realista, más eficiente*

**¡El sistema ahora maneja cargas exactamente como llegan en la realidad!** 🚛📦 