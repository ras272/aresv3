# 🏥 Ares DEMO

**Sistema de Gestión de Equipos Médicos y Mantenimientos**

Una aplicación web demo funcional para **Ares Paraguay** que simula un sistema completo de servicio técnico interno para equipos médicos.

## 🚀 Características Principales

### ✅ Gestión de Equipos
- **Registro completo** de equipos médicos con todos los datos técnicos
- **Búsqueda avanzada** por cliente, número de serie, marca o modelo
- **Tabla interactiva** con información detallada y estados
- **Exportación a CSV** para reportes externos

### ✅ Sistema de Mantenimientos
- **Creación de reclamos** con descripción detallada del problema
- **Estados dinámicos**: Pendiente → En proceso → Finalizado
- **Historial completo** por equipo con fechas y comentarios
- **Carga de archivos simulada** (PDF, DOC, imágenes)
- **Actualización en tiempo real** de estados

### ✅ Dashboard y Reportes
- **Dashboard principal** con métricas en tiempo real
- **Estadísticas visuales** de equipos y mantenimientos
- **Reportes por cliente** y tipo de equipo
- **Análisis de tendencias** y eficiencia
- **Exportación de reportes** personalizados

### ✅ UI/UX Moderno
- **Diseño minimalista** y profesional
- **Responsive design** para móvil y escritorio
- **Animaciones suaves** con Framer Motion
- **Notificaciones** toast integradas
- **Navegación intuitiva** tipo dashboard

## 🛠️ Tecnologías Utilizadas

- **⚡ Next.js 15** - App Router para rendimiento óptimo
- **🎨 Tailwind CSS** - Estilos modernos y responsive  
- **🧩 Shadcn/ui** - Componentes UI de alta calidad
- **✨ Framer Motion** - Animaciones fluidas y profesionales
- **🗄️ Zustand** - Estado global simple y eficiente
- **📝 TypeScript** - Tipado fuerte para mayor confiabilidad
- **✅ Zod** - Validación de esquemas y formularios
- **🎣 React Hook Form** - Manejo de formularios optimizado

## 📁 Estructura del Proyecto

```
src/
├── app/                          # App Router de Next.js
│   ├── page.tsx                 # Dashboard principal
│   ├── equipos/                 # Gestión de equipos
│   │   ├── page.tsx            # Lista de equipos
│   │   └── nuevo/page.tsx      # Registro de equipos
│   ├── equipo/[id]/page.tsx    # Detalles y mantenimientos
│   └── reportes/page.tsx       # Estadísticas y reportes
├── components/
│   ├── layout/                  # Componentes de layout
│   │   ├── DashboardLayout.tsx # Layout principal
│   │   └── Sidebar.tsx         # Navegación lateral
│   └── ui/                     # Componentes Shadcn/ui
├── store/
│   └── useAppStore.ts          # Estado global con Zustand
├── types/
│   └── index.ts                # Definiciones TypeScript
└── lib/
    └── schemas.ts              # Esquemas de validación Zod
```

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase (para base de datos)
- Cuenta de Vercel (para deployment)

### Instalación Local
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/ares-demo.git
cd ares-demo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
npm run dev
```

### Variables de Entorno
Crear un archivo `.env.local` con:
```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
NEXT_PUBLIC_GROQ_API_KEY=tu_api_key_de_groq (opcional)
```

### 🚀 Deploy en Vercel

#### Opción 1: Deploy Automático
1. Haz fork de este repositorio
2. Ve a [vercel.com](https://vercel.com) y conecta tu GitHub
3. Importa el repositorio `ares-demo`
4. Configura las variables de entorno en Vercel
5. ¡Deploy automático!

#### Opción 2: Deploy Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Acceso
- **Local**: [http://localhost:3000](http://localhost:3000)
- **Production**: Tu URL de Vercel (ej: `ares-demo.vercel.app`)

## 📱 Páginas y Funcionalidades

### 🏠 Dashboard (`/`)
- Resumen ejecutivo con métricas principales
- Equipos registrados recientemente
- Mantenimientos urgentes pendientes
- Tarjetas de bienvenida y estado general

### 🔧 Gestión de Equipos (`/equipos`)
- **Tabla completa** con todos los equipos registrados
- **Búsqueda en tiempo real** multi-criterio
- **Filtros visuales** por estado y tipo
- **Botón de exportación** CSV
- **Acceso directo** a detalles de cada equipo

### ➕ Nuevo Equipo (`/equipos/nuevo`)
- **Formulario completo** con validación en tiempo real
- **Secciones organizadas**: Cliente, Equipo, Entrega, Observaciones
- **Selección de tipos** predefinidos de equipos médicos
- **Validación robusta** con mensajes de error claros

### 📋 Detalles del Equipo (`/equipo/[id]`)
- **Información completa** del equipo seleccionado
- **Historial cronológico** de todos los mantenimientos
- **Creación de reclamos** con modal interactivo
- **Cambio de estados** directo desde la interfaz
- **Carga de archivos** simulada con feedback visual
- **Estadísticas** del equipo en sidebar

### 📊 Reportes (`/reportes`)
- **Métricas principales** en tarjetas visuales
- **Estados de mantenimientos** con gráficos de barras
- **Análisis por cliente** con rankings
- **Distribución por tipo** de equipo
- **Exportación CSV** personalizable
- **Resumen ejecutivo** con recomendaciones

## 🎯 Datos de Ejemplo

La aplicación incluye datos precargados para demostrar todas las funcionalidades:

### Equipos de Ejemplo:
- **Hospital Central**: Electrocardiógrafo Philips PageWriter TC50
- **Clínica San José**: Monitor GE Healthcare CARESCAPE B450  
- **Centro Médico Universitario**: Desfibrilador Zoll X Series

### Mantenimientos de Ejemplo:
- Reclamos en diferentes estados (Pendiente, En proceso, Finalizado)
- Descripciones detalladas de problemas técnicos
- Comentarios de ingenieros con soluciones aplicadas

## 🔄 Flujo de Trabajo

1. **Registro de Equipo** → Cliente entrega equipo médico
2. **Documentación** → Se registran todos los datos técnicos
3. **Uso Normal** → Equipo en operación en el cliente
4. **Problema** → Cliente reporta falla o mantenimiento
5. **Reclamo** → Se crea ticket con descripción detallada
6. **Diagnóstico** → Ingeniero evalúa y cambia estado
7. **Resolución** → Se documenta solución y finaliza
8. **Reporte** → Estadísticas y análisis de rendimiento

## 🚀 Próximos Pasos

Esta versión DEMO está lista para integrar:

### Base de Datos
- Reemplazar Zustand con **Supabase** o **Prisma**
- Persistencia real de datos
- Respaldos automáticos

### Autenticación
- **NextAuth.js** para login seguro
- Roles de usuario (Admin, Técnico, Cliente)
- Permisos granulares

### Funcionalidades Avanzadas
- **Notificaciones push** para mantenimientos urgentes
- **Calendario** de mantenimientos programados
- **Códigos QR** para identificación rápida
- **Fotos** de equipos y reparaciones
- **Firmas digitales** de conformidad

### Integraciones
- **WhatsApp API** para notificaciones
- **Email** automático de reportes
- **Inventario** con códigos de barras
- **Facturación** integrada

## 🎨 Personalización

### Colores y Branding
Los colores principales se pueden personalizar en `globals.css`:
- Azul corporativo para elementos principales
- Verde para estados exitosos
- Rojo para alertas y pendientes
- Gris para elementos neutrales

### Tipos de Equipos
Fácilmente expandible en `src/app/equipos/nuevo/page.tsx`:
```typescript
const tiposEquipo = [
  'Electrocardiógrafo',
  'Monitor de Signos Vitales', 
  'Desfibrilador',
  // Agregar más tipos aquí
];
```

## 📞 Soporte

Este es un proyecto demo completamente funcional que demuestra las capacidades completas del sistema propuesto para **Ares Paraguay**.

**Características destacadas:**
- ✅ **100% funcional** sin necesidad de base de datos
- ✅ **Diseño profesional** listo para producción  
- ✅ **Código limpio** y bien documentado
- ✅ **Escalable** para agregar nuevas funcionalidades
- ✅ **Responsive** para todos los dispositivos
- ✅ **Performante** con las mejores prácticas de Next.js

---

**💡 ¡La aplicación está lista para usar!** Simplemente ejecuta `npm run dev` y explora todas las funcionalidades del sistema de gestión de equipos médicos.

*Desarrollado con ❤️ para Ares Paraguay - Sistema de Servicio Técnico DEMO*
