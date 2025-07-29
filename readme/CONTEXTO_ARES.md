# 📋 CONTEXTO PROYECTO ARES

## 🏢 EMPRESA ARES PARAGUAY

**ARES** = Empresa paraguaya de equipos médicos/estéticos

### Modelo de Negocio
- **Venta**: Doctores solicitan equipos (HydraFacial, Ultraformer, CM Slim, etc.)
- **Proceso**: Jefa compra → Llega en 45 días → Prueba en ARES → Entrega a cliente  
- **Post-venta**: Mantenimientos cada 3 meses + reparaciones frecuentes
- **Problema**: "Las operadoras rompen algo del equipo" (piezas de mano)

### DOLOR PRINCIPAL: TRAZABILIDAD
**Problema real**: Llegan 10 cartuchos Ultraformer, no saben qué serie fue a qué cliente. Usan remisiones en papel = "quilombos"

## 👨‍🔧 EQUIPO TÉCNICO
- **Javier Lopez**: ÚNICO técnico de ARES
- Cubre: Asunción y Gran Asunción
- Tareas: Instalaciones, mantenimientos, reparaciones

## 🏗️ SISTEMA DESARROLLADO

### Stack
- Next.js 14 + TypeScript + Tailwind
- Supabase (PostgreSQL)
- shadcn/ui + Framer Motion
- Zustand (estado global)

### Módulos Implementados

#### 1. 📦 MERCADERÍAS
- Registro de equipos/componentes que llegan
- **Código de carga**: `EQUIPO-YYYYMMDD-XXX` (clave de trazabilidad)
- Auto-envío: Equipos médicos → módulo Equipos automáticamente

#### 2. 🏥 EQUIPOS  
- Equipos instalados en clínicas paraguayas
- Hospitales reales: Bautista, Español, Migone, Central
- Direcciones: Av. España, Mcal. López (Asunción real)
- Mantenimientos programados cada 3 meses

#### 3. 🔧 INVENTARIO TÉCNICO (PRINCIPAL)
- **Asignación automática por código de carga**
- **Lógica actual**:
  1. ¿Tiene equipoPadre directo? → Asignación directa
  2. ¿Tiene código de carga? → Buscar equipo con mismo código
  3. ¿Match exacto? → Botón azul (1-click)
  4. Si no → Botón gris (modal manual)

**UI**:
- 🔵 Botón azul: `→ HydraFac...` (automático)
- ⚪ Botón gris: `Asignar` (manual)
- Info visual: "🏥 PARTE DEL EQUIPO X/CLIENTE"

#### 4. 📅 CALENDARIO
- Mantenimientos automáticos cada 3 meses
- Solo Javier Lopez como técnico

#### 5. 📦 SISTEMA DE STOCK (NUEVO - SORTLY-STYLE)
- **Organización automática por marca**: Folders de Classys, ARES, Philips, Venus
- **Cards compactas profesionales**: 2-6 columnas responsive con fotos prominentes
- **Trazabilidad completa**: Códigos QR, números de serie, ubicaciones físicas
- **Pick Lists funcionales**: Listas de recolección para mantenimientos/envíos
- **Alertas automáticas**: Stock bajo, vencimientos, sin movimiento
- **Check-in/Check-out**: Registro de quién toma qué y cuándo
- **Búsqueda inteligente**: Por nombre, marca, modelo, serie, tags

**Solución al dolor principal**:
- ✅ **ANTES**: "¿Cuál cartucho fue al Hospital Central?" → ❌ Sin control
- ✅ **AHORA**: Búsqueda instant + historial completo + trazabilidad total

## 🔄 HISTORIAL CAMBIOS IMPORTANTES

### ✅ Implementado
1. **Flujo automático Mercaderías → Equipos**
2. **Solo Javier Lopez** (eliminados técnicos ejemplo)
3. **Contexto paraguayo real** (hospitales, direcciones, doctores)
4. **Inventario responsive** (columnas combinadas, móvil-friendly)
5. **Asignación automática por código** (evita duplicados)
6. **🆕 Sistema de Stock Sortly-Style** (Enero 2025)
   - Organización automática por marca
   - Cards compactas profesionales
   - Funcionalidad completa (Pick Lists, QR, alertas)
   - Trazabilidad total de inventario

### ✅ Bug Resuelto
**Problema**: Pieza de mano Nancy Galeano se asigna a otra doctora
**Solución**: Implementado sistema de stock completo que reemplaza lógica problemática
**Estado**: ✅ Resuelto con nuevo sistema

## 🗄️ MODELO DATOS CLAVE

### Componente
```typescript
{
  nombre: "Pieza de mano CM Slim",
  codigoCargaOrigen: "CM-SLIM-20250115-001", // CLAVE asignación
  equipoPadre?: {
    equipoId: string,
    nombreEquipo: string,
    cliente: string
  }
}
```

### Equipo
```typescript
{
  nombreEquipo: "CM Slim Nancy-ENTRADA-20250115-001",
  cliente: "Nancy Galeano",
  ubicacion: "Hospital Bautista - Piso 3"
}
```

## 🎯 REGLAS DE DESARROLLO

1. **Mantener contexto paraguayo** (nombres, ubicaciones reales)
2. **Solo Javier Lopez** como técnico
3. **Priorizar asignación automática** por código de carga
4. **Responsive first** (mobile-friendly)
5. **Terminología local**: "quilombo", "jefa"
6. **Logs de debug** para troubleshooting

## 🚀 COMANDO INICIO CHAT
```
"Lee CONTEXTO_ARES.md y continúa desde donde dejamos"
```

---
*Proyecto: Sistema Gestión Técnica ARES Paraguay*
*Estado: Desarrollo activo*
*Última actualización: Enero 2025 - Sistema de Stock Implementado* 