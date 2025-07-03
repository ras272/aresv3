# 📦 Módulo de Ingreso de Mercaderías - Ares Paraguay

## 🎯 Descripción

Sistema completo de gestión de ingresos de mercaderías para Ares Paraguay, especializado en equipos médicos y productos técnicos. El módulo es minimalista, rápido y funcional, con integración automática al módulo de Servicio Técnico.

## ✨ Características Principales

### 🔥 Funcionalidades Core
- **Registro Universal**: Maneja insumos, repuestos y equipos médicos
- **Códigos Automáticos**: Genera códigos de carga únicos (`ENTRADA-YYYYMMDD-XXX`)
- **Integración Automática**: Los equipos médicos se envían automáticamente al módulo de Servicio Técnico
- **Gestión de Subitems**: Para equipos médicos, permite registrar componentes y accesorios
- **Validación Inteligente**: Número de serie obligatorio solo para equipos médicos
- **Búsqueda Avanzada**: Filtrado por múltiples criterios
- **Interfaz Responsive**: Optimizada para desktop y móvil

### 📋 Campos del Formulario
- **Código de carga** (generado automáticamente)
- **Fecha de ingreso** (por defecto hoy)
- **Producto o equipo** ✅
- **Tipo de producto**: Insumo | Repuesto | Equipo Médico ✅
- **Marca** ✅
- **Modelo** ✅
- **Número de serie** (opcional, obligatorio para equipos médicos)
- **Cantidad** ✅
- **Destino** (cliente, clínica o sede) ✅
- **Observaciones**
- **Imagen del equipo** (opcional, visible si es equipo médico)

### 🏥 Funcionalidad Especial - Equipos Médicos
Cuando el tipo de producto es "Equipo Médico":
- Se muestra una sección dinámica de **Subitems**
- Cada subitem incluye: nombre, número de serie, cantidad
- Al guardar, se envía automáticamente al módulo de Servicio Técnico
- Los subitems se convierten en componentes del equipo
- Se genera una entrada completa en el dashboard de Servicio Técnico

## 🛠️ Tecnologías Utilizadas

- **Next.js 15** con App Router y TypeScript
- **Zustand** para manejo de estado local
- **Tailwind CSS** para diseño minimalista
- **Shadcn/ui** para componentes de interfaz
- **Zod** para validación de formularios
- **React Hook Form** para manejo de formularios
- **Framer Motion** para animaciones suaves
- **Sonner** para notificaciones toast

## 📁 Estructura de Archivos

```
src/
├── app/
│   └── mercaderias/
│       └── page.tsx                    # Página principal del módulo
├── components/
│   └── mercaderias/
│       ├── FormularioIngreso.tsx       # Formulario de ingreso
│       └── TablaIngresos.tsx          # Tabla de ingresos registrados
├── types/
│   └── index.ts                       # Tipos: IngresoMercaderia, SubItem
├── lib/
│   └── schemas.ts                     # Validaciones Zod
└── store/
    └── useAppStore.ts                 # Estado global con Zustand
```

## 🚀 Cómo Usar el Módulo

### 1. Acceso al Módulo
- Navegar a **"Ingreso de Mercaderías"** en el sidebar
- El botón **"Nuevo Ingreso"** abre el formulario modal

### 2. Registro de Insumos/Repuestos
```typescript
// Ejemplo de registro de insumo
{
  producto: "Filtros HEPA",
  tipoProducto: "Insumo",
  marca: "MedFilter",
  modelo: "HF-200",
  cantidad: 50,
  destino: "Clínica San José - UCI",
  observaciones: "Reposición mensual"
}
```

### 3. Registro de Equipos Médicos
```typescript
// Ejemplo de equipo médico con subitems
{
  producto: "Electrocardiógrafo Portátil",
  tipoProducto: "Equipo Médico",
  marca: "Philips",
  modelo: "PageWriter TC30",
  numeroSerie: "PH-2024-TC30-001", // Obligatorio
  cantidad: 1,
  destino: "Hospital Central - Cardiología",
  subitems: [
    {
      nombre: "Cables ECG",
      numeroSerie: "PH-2024-TC30-001-CABLES",
      cantidad: 1
    }
  ]
}
```

### 4. Resultado Automático
- **Código generado**: `ENTRADA-20241201-001`
- **Toast de confirmación** con detalles
- **Si es equipo médico**: Automáticamente aparece en el módulo de Servicio Técnico

## 📊 Dashboard y Estadísticas

El módulo incluye un dashboard con métricas clave:
- **Total Ingresos**: Contador de productos registrados
- **Ingresos Hoy**: Productos ingresados en el día actual
- **Equipos Médicos**: Contador de equipos enviados a Servicio Técnico

## 🔍 Búsqueda y Filtrado

La tabla permite búsqueda por:
- Nombre del producto
- Marca y modelo
- Código de carga
- Destino
- Número de serie

## 🔄 Integración con Servicio Técnico

### Función `addEquipoAlServicioTecnico()`

Cuando se registra un equipo médico, la función:
1. Convierte el ingreso a formato de equipo
2. Crea el equipo principal con sus componentes
3. Mapea los subitems como componentes del equipo
4. Lo agrega automáticamente al store de equipos
5. Muestra confirmación en consola

```typescript
// Los subitems se convierten en componentes
subitems.map(subitem => ({
  nombre: subitem.nombre,
  numeroSerie: subitem.numeroSerie,
  estado: 'Operativo',
  observaciones: `Cantidad: ${subitem.cantidad}`
}))
```

## 🎨 Diseño Minimalista

### Paleta de Colores por Tipo
- **Insumos**: Verde (`bg-green-100 text-green-800`)
- **Repuestos**: Amarillo (`bg-yellow-100 text-yellow-800`)
- **Equipos Médicos**: Azul (`bg-blue-100 text-blue-800`)

### Componentes UI
- **Cards** para secciones organizadas
- **Badges** para identificación visual
- **Modals** con animaciones suaves
- **Formularios** responsivos con validación en tiempo real
- **Tablas** expandibles con detalles completos

## 🧪 Datos de Ejemplo

El sistema incluye datos de ejemplo para demostración:
- Electrocardiógrafo con subitems
- Filtros HEPA como insumo
- Historial de ingresos con diferentes tipos

## 📝 Validaciones

### Esquema Zod Implementado
```typescript
export const ingresoMercaderiaSchema = z.object({
  producto: z.string().min(1, 'El nombre del producto es obligatorio'),
  tipoProducto: z.enum(['Insumo', 'Repuesto', 'Equipo Médico']),
  marca: z.string().min(1, 'La marca es obligatoria'),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  numeroSerie: z.string().optional(),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  destino: z.string().min(1, 'El destino es obligatorio'),
  // ... más validaciones
}).refine((data) => {
  // Validación condicional: N° serie obligatorio para equipos médicos
  if (data.tipoProducto === 'Equipo Médico') {
    return data.numeroSerie && data.numeroSerie.length > 0;
  }
  return true;
}, {
  message: 'El número de serie es obligatorio para equipos médicos',
  path: ['numeroSerie'],
});
```

## 🚦 Estado de Desarrollo

✅ **Completado y Funcional**
- Formulario completo con validaciones
- Gestión de subitems dinámicos
- Integración automática con Servicio Técnico
- Dashboard con estadísticas
- Tabla de ingresos con búsqueda
- Generación automática de códigos
- Diseño responsive y minimalista

## 🔮 Posibles Extensiones Futuras

- **Base de Datos**: Migrar de estado local a PostgreSQL/MongoDB
- **Reportes PDF**: Generar reportes de ingresos
- **Códigos QR**: Para identificación rápida de productos
- **Historial de Cambios**: Auditoría de modificaciones
- **Alertas de Stock**: Notificaciones de inventario bajo
- **API REST**: Para integración con otros sistemas

---

**🏥 Desarrollado especialmente para Ares Paraguay**  
*Sistema de gestión de equipos médicos y productos técnicos* 