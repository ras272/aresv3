# 📋 CONTEXTO PROYECTO ARES - SISTEMA DE GESTIÓN TÉCNICA

## 🏢 SOBRE ARES (EMPRESA PARAGUAYA)

### Modelo de Negocio
**ARES** es una empresa paraguaya especializada en **equipos médicos/estéticos**:
- **Venta de equipos**: Doctores/clínicas solicitan equipos (HydraFacial, Ultraformer, CM Slim, CoolSculpting, etc.)
- **Proceso de importación**: Jefa compra → Equipos llegan en ~45 días → Prueba en ARES → Entrega a cliente
- **Servicio post-venta**: Mantenimientos cada 3 meses + reparaciones frecuentes
- **Problema recurrente**: "Las operadoras rompen algo del equipo" (especialmente piezas de mano)

### Gestión de Inventario Actual
- **Sortly**: Inventario general de la empresa
- **Sistema desarrollado**: Especializado en equipos médicos y servicio técnico
- **Enfoque**: Trazabilidad de números de serie y ubicación de componentes

## 🎯 DOLOR PRINCIPAL: TRAZABILIDAD

### Problema Real
**"El mayor problema es la gestión de números de serie y ubicación de componentes"**
- Ejemplo: Llegan 10 cartuchos Ultraformer diferentes (1.5, 3.0, 4.5, etc.)
- No saben cuál número de serie fue a cuál cliente
- Usan remisiones en papel que generan "quilombos"
- Cuando un cartucho se rompe, no pueden rastrear historial/garantía

### Casos de Uso Frecuentes
- **HydraFacial**: Equipo principal + 3-5 piezas de mano específicas
- **Ultraformer**: Múltiples cartuchos con frecuencias diferentes
- **CM Slim**: Aplicadores específicos por zona corporal
- **Repuestos urgentes**: Identificar qué cliente necesita qué pieza

## 👨‍🔧 EQUIPO TÉCNICO

### Personal
- **Javier Lopez**: Único técnico de ARES (reemplaza ejemplos anteriores)
- Realiza: Instalaciones, mantenimientos programados, reparaciones de emergencia
- Cobertura: Asunción y Gran Asunción (Paraguay)

### Flujo de Trabajo
1. **Mantenimiento programado**: Cada 3 meses por equipo
2. **Reparaciones de emergencia**: Piezas rotas por operadoras
3. **Instalaciones**: Equipos nuevos en clínicas
4. **Gestión de repuestos**: Asignación desde inventario técnico

## 🏗️ ARQUITECTURA DEL SISTEMA

### Stack Tecnológico
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: shadcn/ui components
- **State**: Zustand (useAppStore)
- **Animaciones**: Framer Motion

### Estructura de Carpetas
```
src/
├── app/                    # Pages (App Router)
│   ├── equipos/           # Gestión de equipos médicos
│   ├── inventario-tecnico/ # Componentes y repuestos
│   ├── calendario/        # Mantenimientos programados
│   ├── mercaderias/       # Registro de cargas nuevas
│   └── reportes/          # Reportes y estadísticas
├── components/            # Componentes reutilizables
├── lib/                   # Utilities y servicios
├── store/                 # Estado global (Zustand)
└── types/                 # Definiciones TypeScript
```

## 📊 MÓDULOS IMPLEMENTADOS

### 1. 📦 MERCADERÍAS (Punto de Entrada)
**Funcionalidad**: Registro inicial de equipos/componentes que llegan a ARES
- **Carga individual**: Un equipo a la vez
- **Carga masiva**: Múltiples items con Excel/CSV
- **Código de carga**: Sistema de trazabilidad (`EQUIPO-YYYYMMDD-XXX`)
- **Auto-envío**: Equipos médicos se envían automáticamente al módulo Equipos

**Flujo**:
1. Llega HydraFacial con 3 piezas de mano
2. Se registra con código `HYDRA-20250115-001`
3. Equipo principal → módulo Equipos
4. Componentes → Inventario Técnico
5. Relación automática por código de carga

### 2. 🏥 EQUIPOS (Gestión Principal)
**Funcionalidad**: Equipos médicos instalados en clínicas
- **Información completa**: Cliente, ubicación, series, estado
- **Trazabilidad**: Historial completo desde llegada hasta instalación
- **Mantenimientos**: Programación automática cada 3 meses
- **Contexto paraguayo**: Hospitales reales, direcciones de Asunción

**Datos de ejemplo**:
- Hospital Bautista, Hospital Español, Sanatorio Migone
- Direcciones reales de Asunción (Av. España, Mcal. López, etc.)
- Doctores paraguayos: Dr. García, Dra. Mendoza, etc.

### 3. 🔧 INVENTARIO TÉCNICO (Corazón del Sistema)
**Funcionalidad**: Gestión inteligente de componentes y repuestos
- **Asignación automática**: Por código de carga (PRINCIPAL)
- **Asignación manual**: Para casos especiales
- **Trazabilidad completa**: Historial de cada componente
- **Estados**: Disponible, Asignado, En reparación

**Lógica de Asignación Inteligente**:
```
1. ¿Tiene equipoPadre directo? → Asignación directa
2. ¿Tiene código de carga? → Buscar equipo con mismo código
3. ¿Se encontró match? → Botón azul (asignación 1-click)
4. Si no: → Botón gris (modal manual)
```

**UI Responsiva**:
- **Botón azul**: `→ HydraFac...` (asignación automática)
- **Botón gris**: `Asignar` (selección manual)
- **Información visual**: "🏥 PARTE DEL EQUIPO EquipoX/CLIENTE"

### 4. 📅 CALENDARIO (Mantenimientos)
**Funcionalidad**: Programación automática de mantenimientos
- **Frecuencia**: Cada 3 meses por equipo
- **Técnico**: Solo Javier Lopez
- **Estados**: Programado, En Proceso, Completado, Cancelado
- **Integración**: Con equipos y ubicaciones reales

### 5. 📦 SISTEMA DE STOCK (SORTLY-STYLE)
**Funcionalidad**: Control total de inventario médico tipo Sortly profesional
- **Organización por marca**: Folders automáticos (Classys, ARES, Philips, Venus)
- **Cards compactas**: Vista grid 2-6 columnas responsive
- **Trazabilidad completa**: Códigos QR, números de serie, ubicaciones
- **Check-in/Check-out**: Registro de quién toma qué y cuándo
- **Pick Lists**: Listas de recolección para mantenimientos/envíos
- **Alertas automáticas**: Stock bajo, vencimientos, sin movimiento

**Características Visuales**:
- **Header profesional**: Gradientes azules, backdrop blur, logo icónico
- **Cards por marca**: Gradientes únicos, iconos específicos (🏥 Classys, ⚡ ARES)
- **Items compactos**: Foto + cantidad prominente + estado + tags
- **Navegación intuitiva**: Breadcrumb dinámico, hover effects
- **Búsqueda inteligente**: Por nombre, marca, modelo, serie, tags

**Base de Datos Stock**:
```sql
-- Enums del sistema
tipo_ubicacion: 'Almacen', 'Estante', 'Contenedor', 'Area', 'Equipo'
estado_ubicacion: 'Activa', 'Inactiva', 'Mantenimiento'
estado_stock: 'Disponible', 'Reservado', 'En_uso', 'Dañado', 'Vencido'
tipo_movimiento_stock: 'Entrada', 'Salida', 'Transferencia', 'Ajuste'

-- Tablas principales
ubicaciones_stock: Organización física jerárquica
stock_items: Items individuales con trazabilidad
movimientos_stock: Historial completo de movimientos
alertas_stock: Sistema de notificaciones automáticas
```

**Flujo de Trabajo**:
1. **Vista principal**: Browse by Brand → Folders por marca automáticos
2. **Vista marca**: Grid compacto de productos de esa marca
3. **Detalles item**: Modal profesional con fotos, QR, custom fields
4. **Pick Lists**: Selección múltiple → Lista de recolección
5. **Alertas**: Notificaciones proactivas de stock crítico

### 6. 📊 REPORTES
**Funcionalidad**: Estadísticas y análisis del servicio técnico
- **Equipos por estado**: Activo, Mantenimiento, Reparación
- **Historial de servicio**: Por equipo, cliente, técnico
- **Componentes críticos**: Stock bajo, alta rotación
- **Métricas de stock**: Movimientos, rotación, alertas por marca

## 🔄 HISTORIAL DE DESARROLLO

### Implementaciones Clave

#### ✅ Flujo Automático Mercaderías → Equipos
**Problema**: Equipos médicos no se enviaban automáticamente
**Solución**: Detección automática de "Equipo Médico" OR "paraServicioTecnico"
**Resultado**: Proceso 100% automático

#### ✅ Actualización Técnico Único
**Cambio**: Eliminación de técnicos de ejemplo (Juan Pérez, María González)
**Implementación**: Solo "Javier Lopez" en todo el sistema
**Contexto**: Refleja la realidad de ARES

#### ✅ Contexto Paraguayo Real
**Antes**: Lorem ipsum y datos genéricos
**Después**: 
- Hospitales: Bautista, Español, Migone, Central
- Ubicaciones: Asunción, San Lorenzo, Luque, Fernando de la Mora
- Direcciones: Av. España, Mcal. López, Av. Mariscal López
- Doctores: Dr. García, Dra. Mendoza, Dr. Villalba

#### ✅ Mejora Visual Inventario Técnico
**Problema**: Scroll horizontal molesto
**Solución**: Diseño responsive con:
- Columnas combinadas (Marca/Modelo/Tipo)
- Ocultación progresiva según pantalla
- Botones compactos con tooltips
- Información de equipo padre prominente

#### ✅ Asignación Automática por Código de Carga
**Evolución**:
1. **V1**: Búsqueda por marca (problemática con equipos duplicados)
2. **V2**: Validación de unicidad + alertas de ambigüedad
3. **V3**: **ACTUAL** - Solo por código de carga exacto

**Lógica Actual**:
- Si componente tiene código `HYDRA-20250115-001`
- Busca equipo que contenga exactamente ese código
- Solo muestra botón azul si hay match exacto
- Evita 100% asignaciones erróneas

#### 🐛 Debug de Asignación Incorrecta
**Estado**: Resuelto
**Problema**: Pieza de mano de Nancy Galeano se asigna a otra doctora
**Solución**: Implementado sistema de stock completo que reemplaza la lógica problemática
**Herramientas**: Logs de debug añadidos para identificar causa exacta

#### ✅ Sistema de Stock Sortly-Style Implementado
**Fecha**: Enero 2025
**Motivación**: "Sin control de inventario era imposible gestionar todo adecuadamente"
**Características**:
- **Organización visual**: Folders automáticos por marca (estilo Sortly real)
- **Cards compactas**: 2-6 columnas responsive, fotos prominentes
- **Diseño profesional**: Gradientes, animaciones, hover effects
- **Funcionalidad completa**: Check-in/out, Pick Lists, QR codes, alertas

**Mejoras Visuales**:
```diff
- Cards grandes (4 por fila) con mucha información
+ Cards compactas tipo Sortly (6 por fila) con info esencial
- Organización por ubicación física
+ Organización por marca automática
- Header básico gris
+ Header profesional con gradientes azules
- Navegación compleja
+ Navegación intuitiva tipo marketplace
```

**Base de Datos Migrada**:
- ✅ Tablas de stock creadas (ubicaciones_stock, stock_items, etc.)
- ✅ Enums del sistema definidos
- ✅ Migración automática de componentes_disponibles
- ✅ Triggers y funciones SQL avanzadas
- ✅ Políticas RLS configuradas

**Problema ANTES**:
❌ "Tengo 10 cartuchos Ultraformer, pero ¿cuál serie fue al Hospital Central?"
❌ "¿Dónde está el cartucho DS-4.5 serie ULT-2024-001?"

**Solución AHORA**:
✅ **Trazabilidad completa**: Cada item tiene código único y ubicación
✅ **Búsqueda inteligente**: Por nombre, marca, modelo, serie, tags
✅ **Historial completo**: Quién tomó qué y cuándo
✅ **Alertas proactivas**: Stock bajo, vencimientos automáticos

## 🗄️ MODELO DE DATOS

### Entidades Principales

#### Equipos
```typescript
{
  id: string;
  nombreEquipo: string;        // "HydraFacial Pro-ENTRADA-20250115-001"
  marca: string;               // "HydraFacial"
  modelo: string;              // "Pro"
  numeroSerie: string;         // "HFP2024001234"
  cliente: string;             // "Dr. García - Clínica Estética"
  ubicacion: string;           // "Hospital Bautista - Piso 3"
  estado: string;              // "Activo", "Mantenimiento", etc.
  fechaInstalacion: string;
  proximoMantenimiento: string;
}
```

#### Componentes (Inventario Técnico)
```typescript
{
  id: string;
  nombre: string;              // "Pieza de mano CM Slim"
  marca: string;               // "CM Slim"
  modelo: string;              // "Applicator Pro"
  tipoComponente: string;      // "Pieza de mano", "Cartucho", etc.
  numeroSerie: string;         // "CMS2024001"
  cantidadDisponible: number;
  cantidadOriginal: number;
  estado: string;              // "Disponible", "Asignado", "En reparación"
  codigoCargaOrigen: string;   // "CM-SLIM-20250115-001" (CLAVE para asignación)
  equipoPadre?: {              // Relación directa (opcional)
    equipoId: string;
    nombreEquipo: string;
    cliente: string;
    numeroSerieBase: string;
  }
}
```

#### Mantenimientos
```typescript
{
  id: string;
  equipoId: string;
  tecnico: string;             // Siempre "Javier Lopez"
  fechaProgramada: string;
  tipo: string;                // "Preventivo", "Correctivo"
  estado: string;              // "Programado", "Completado", etc.
  observaciones: string;
}
```

#### Sistema de Stock (Nuevo)

**Ubicaciones Stock**:
```typescript
{
  id: string;
  nombre: string;              // "Almacén Principal", "Taller Técnico"
  descripcion: string;         // Descripción opcional
  codigo: string;              // "ALM-001", "TAL-001" (único)
  tipo: 'Almacen' | 'Area' | 'Estante' | 'Contenedor' | 'Equipo';
  estado: 'Activa' | 'Inactiva' | 'Mantenimiento';
  ubicacion_padre_id?: string; // Jerarquía opcional
  created_at: string;
}
```

**Stock Items**:
```typescript
{
  id: string;
  codigo_item: string;         // Código único autogenerado
  nombre: string;              // "Cartucho Ultraformer DS-4.5"
  marca: string;               // "Classys" (para agrupación por marca)
  modelo: string;              // "DS-4.5"
  numero_serie?: string;       // Serie específica
  cantidad_actual: number;     // Stock actual
  cantidad_minima: number;     // Para alertas automáticas
  estado: 'Disponible' | 'Reservado' | 'En_uso' | 'Dañado' | 'Vencido';
  ubicacion_id?: string;       // Referencia a ubicaciones_stock
  fecha_ingreso: string;
  fotos: string[];             // URLs de fotos
  custom_fields: Record<string, any>; // Campos personalizados
  tags: string[];              // Para búsqueda y categorización
  created_at: string;
}
```

**Movimientos Stock**:
```typescript
{
  id: string;
  stock_item_id: string;
  tipo_movimiento: 'Entrada' | 'Salida' | 'Transferencia' | 'Ajuste' | 'Asignacion';
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  ubicacion_origen_id?: string;
  ubicacion_destino_id?: string;
  motivo: string;              // Razón del movimiento
  usuario: string;             // Quien realizó el movimiento
  fecha_movimiento: string;
  observaciones?: string;
}
```

**Alertas Stock**:
```typescript
{
  id: string;
  stock_item_id: string;
  tipo_alerta: 'stock_minimo' | 'vencimiento' | 'sin_movimiento';
  titulo: string;              // "Stock Crítico: Cartucho DS-4.5"
  mensaje: string;             // Descripción detallada
  prioridad: 1 | 2 | 3 | 4 | 5; // 1=baja, 5=crítica
  estado: 'activa' | 'leida' | 'resuelta' | 'desactivada';
  fecha_creacion: string;
  fecha_limite?: string;       // Para alertas con deadline
}
```

## 🎨 CONVENCIONES DE DISEÑO

### Colores por Estado
- **🟢 Verde**: Disponible, Activo, Completado
- **🔵 Azul**: Asignado, En Proceso, Información
- **🟡 Amarillo**: Programado, Pendiente, Advertencia
- **🔴 Rojo**: En Reparación, Crítico, Error
- **⚪ Gris**: Inactivo, Cancelado, Neutral

### Iconografía
- **🏥**: Equipos en hospitales/clínicas
- **🔧**: Servicio técnico/reparaciones
- **📦**: Mercaderías/cargas nuevas
- **📅**: Mantenimientos programados
- **📊**: Reportes y estadísticas
- **🎯**: Asignación directa automática

### UX Patterns
- **Asignación 1-click**: Botones azules para acciones automáticas
- **Confirmación visual**: Toasts informativos con contexto
- **Información contextual**: Tooltips descriptivos
- **Responsive first**: Mobile-friendly desde diseño

## 🚀 FUNCIONALIDADES EN DESARROLLO

### ✅ Implementado Recientemente
1. **✅ Sistema de Stock Sortly-Style**: Control total de inventario
2. **✅ Códigos QR**: Generación automática para items y ubicaciones
3. **✅ Organización por marca**: Folders automáticos (Classys, ARES, etc.)
4. **✅ Pick Lists**: Listas de recolección funcionales
5. **✅ Alertas automáticas**: Stock bajo, vencimientos

### Próximas Implementaciones
1. **Generación de remisiones digitales**: Reemplazar papel completamente
2. **Notificaciones WhatsApp**: Recordatorios de mantenimiento automáticos
3. **Dashboard de métricas avanzado**: KPIs del servicio técnico + stock
4. **Integración Sortly**: Sincronización bidireccional de inventarios
5. **Escaneo QR móvil**: App mobile para escanear códigos QR
6. **Reportes de stock**: PDF/Excel con gráficos y métricas
7. **Gestión de proveedores**: Catálogo y órdenes de compra
8. **Predicción de stock**: IA para anticipar necesidades

### Optimizaciones Stock Pendientes
1. **Fotos reales**: Carga de fotos de productos ARES
2. **Más marcas**: Ampliar catálogo con proveedores reales
3. **Ubicaciones jerárquicas**: Almacén → Área → Estante → Contenedor
4. **Estados avanzados**: En tránsito, En garantía, Descontinuado
5. **Custom fields dinámicos**: Campos personalizables por tipo de item
6. **Integración con mercaderías**: Auto-creación de stock items
7. **Vista de lista avanzada**: Tabla con sorting y filtros múltiples
8. **Batch operations**: Acciones masivas (mover, actualizar estado)

### Optimizaciones Técnicas Pendientes
1. **Performance**: Lazy loading para listas grandes de stock
2. **Caché inteligente**: Reducir consultas a Supabase
3. **Búsqueda avanzada**: Filtros combinados y búsqueda fuzzy
4. **Offline support**: PWA para trabajar sin internet
5. **Sincronización en tiempo real**: WebSockets para actualizaciones live

## 🔧 CONFIGURACIÓN TÉCNICA

### Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Base de Datos (Supabase)
- **Tablas principales**: equipos, componentes_disponibles, asignaciones, mantenimientos
- **RLS**: Row Level Security habilitado
- **Triggers**: Mantenimientos automáticos, actualización de estados

### Scripts Útiles
```bash
npm run dev          # Desarrollo local
npm run build        # Build producción
npm run start        # Servidor producción
npm run lint         # ESLint check
```

## 📝 NOTAS IMPORTANTES

### Contexto Cultural Paraguay
- **Términos locales**: "Quilombo" (problema/lío), "Jefa" (manager/boss)
- **Ubicaciones reales**: Solo direcciones existentes de Asunción
- **Hospitales verificados**: Datos basados en centros médicos reales

### Decisiones de Diseño
- **Un solo técnico**: Refleja realidad actual de ARES
- **Códigos de carga**: Sistema propio para trazabilidad total
- **Asignación automática**: Prioriza eficiencia sobre flexibilidad
- **UI en español**: 100% localizado para Paraguay

### Limitaciones Actuales
- **Escalabilidad técnicos**: Diseñado para 1 técnico (expandible)
- **Idioma único**: Solo español
- **Zona geográfica**: Enfocado en Gran Asunción

---

## 🎯 INSTRUCCIONES PARA NUEVOS CHATS

**Para desarrolladores que continúen este proyecto:**

1. **Lee este contexto completo** antes de hacer cambios
2. **Mantén el contexto paraguayo** en nombres y ubicaciones
3. **Respeta el flujo de código de carga** para trazabilidad
4. **Solo Javier Lopez como técnico** (no agregar otros)
5. **Prioriza asignación automática** sobre manual
6. **Usa logs de debug** para troubleshooting
7. **Mantén responsive design** en todas las pantallas
8. **Conserva la terminología local** (quilombo, jefa, etc.)

**Sistema de Stock (Nuevo):**
9. **Organización por marca**: Mantén folders automáticos por marca
10. **Cards compactas**: Estilo Sortly profesional (2-6 columnas)
11. **Datos reales**: Usar componentes_disponibles como fuente
12. **Gradientes únicos**: Cada marca tiene su color/icono específico
13. **Funcionalidad completa**: Pick Lists, QR codes, alertas deben funcionar
14. **Navegación intuitiva**: Breadcrumb dinámico y hover effects
15. **Búsqueda inteligente**: Por nombre, marca, modelo, serie, tags

**Comando de inicio rápido:**
```
"Lee CONTEXTO_PROYECTO_ARES.md y continúa desde donde dejamos"
```

---

*Última actualización: Enero 2025 - Sistema de Stock Sortly-Style Implementado*
*Proyecto: Sistema de Gestión Técnica ARES Paraguay*
*Estado: En desarrollo activo*
*Módulos: Mercaderías ✅ | Equipos ✅ | Inventario Técnico ✅ | Calendario ✅ | **Stock System ✅** | Reportes 🔄* 