# 🔧 Análisis: Sistema de Asignación de Técnicos en ARES

## 📋 Estado Actual del Sistema

### 🏗️ **Arquitectura de Técnicos**

El sistema ARES maneja técnicos a través de **DOS sistemas paralelos**:

#### 1. **Sistema de Usuarios (`user_profiles`)**
```sql
-- Técnicos como usuarios del sistema
SELECT id, name, email, role 
FROM user_profiles 
WHERE role = 'tecnico' AND is_active = true;
```

**Características:**
- ✅ Integrado con autenticación
- ✅ Control de acceso y permisos
- ✅ Estados activo/inactivo
- ❌ Sin información de especialidades
- ❌ Sin horarios de disponibilidad

#### 2. **Sistema de Técnicos (`tecnicos`)**
```sql
-- Técnicos especializados para asignaciones
CREATE TABLE tecnicos (
    id UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    especialidades TEXT[],
    disponibilidad JSONB,
    activo BOOLEAN DEFAULT TRUE
);
```

**Características:**
- ✅ Especialidades definidas
- ✅ Horarios de disponibilidad por día
- ✅ Control granular de disponibilidad
- ❌ No integrado con autenticación
- ❌ Duplicación de datos con user_profiles

## 🔄 **Flujo Actual de Asignación**

### **1. Creación de Tickets (ServTec)**

```typescript
// En TicketForm.tsx - Línea 200+
<Select 
  value={formData.tecnicoAsignado || ''} 
  onValueChange={(value) => handleInputChange('tecnicoAsignado', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Asignar más tarde..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="sin-asignar">Sin asignar</SelectItem>
    {tecnicos.map((tecnico) => (
      <SelectItem key={tecnico.id} value={tecnico.id}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${tecnico.disponible ? 'bg-green-500' : 'bg-red-500'}`} />
          {tecnico.nombre}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Proceso:**
1. ✅ Usuario selecciona equipo
2. ✅ Usuario define prioridad y tipo
3. ✅ **Sistema carga técnicos disponibles**
4. ✅ Usuario asigna técnico (opcional)
5. ✅ Ticket se crea con `tecnico_asignado`

### **2. Obtención de Técnicos**

```typescript
// En tickets.ts - obtenerTecnicosDisponibles()
export async function obtenerTecnicosDisponibles() {
  const { data, error } = await supabase
    .from('user_profiles')  // ⚠️ USA user_profiles, NO tecnicos
    .select('id, name, email, role')
    .eq('role', 'tecnico')
    .eq('is_active', true);

  return data.map(tecnico => ({
    id: tecnico.id,
    nombre: tecnico.name,
    email: tecnico.email,
    disponible: true // ⚠️ HARDCODEADO - No verifica disponibilidad real
  }));
}
```

**Problemas Identificados:**
- ❌ **Inconsistencia**: Usa `user_profiles` en lugar de `tecnicos`
- ❌ **Disponibilidad falsa**: Siempre marca como `disponible: true`
- ❌ **Sin especialidades**: No considera especialidades del técnico
- ❌ **Sin horarios**: No verifica horarios de trabajo

### **3. Almacenamiento en BD**

```sql
-- En mantenimientos table
INSERT INTO mantenimientos (
  equipo_id,
  tipo,
  descripcion,
  prioridad,
  tecnico_asignado,  -- ⚠️ Se guarda como STRING, no como FK
  fecha_programada
) VALUES (...);
```

**Problemas:**
- ❌ **No es FK**: `tecnico_asignado` es VARCHAR, no referencia a técnicos
- ❌ **Sin validación**: No valida que el técnico exista
- ❌ **Datos duplicados**: Nombre del técnico, no ID

## 🚨 **Problemas Críticos Identificados**

### **1. Inconsistencia de Datos**
```typescript
// ❌ PROBLEMA: Dos fuentes de verdad
const tecnicosAuth = await supabase.from('user_profiles').select('*').eq('role', 'tecnico');
const tecnicosAsignacion = await supabase.from('tecnicos').select('*');
// Pueden tener datos diferentes!
```

### **2. Disponibilidad No Funcional**
```typescript
// ❌ PROBLEMA: Siempre disponible
disponible: true // Hardcodeado, no verifica horarios reales
```

### **3. Sin Validación de Especialidades**
```typescript
// ❌ PROBLEMA: No considera especialidades
// Un técnico de software puede ser asignado a equipo médico
```

### **4. Asignación Manual Únicamente**
```typescript
// ❌ PROBLEMA: Solo asignación manual
// No hay algoritmo de asignación automática
```

## 💡 **Propuestas de Mejora**

### **🎯 PRIORIDAD ALTA - Unificar Sistemas**

#### **Opción A: Usar Solo `user_profiles` (Recomendado)**
```sql
-- Agregar campos a user_profiles
ALTER TABLE user_profiles 
ADD COLUMN especialidades TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN disponibilidad JSONB DEFAULT '{
  "lunes": {"inicio": "08:00", "fin": "17:00", "disponible": true},
  "martes": {"inicio": "08:00", "fin": "17:00", "disponible": true},
  "miercoles": {"inicio": "08:00", "fin": "17:00", "disponible": true},
  "jueves": {"inicio": "08:00", "fin": "17:00", "disponible": true},
  "viernes": {"inicio": "08:00", "fin": "17:00", "disponible": true},
  "sabado": {"inicio": "08:00", "fin": "12:00", "disponible": false},
  "domingo": {"inicio": "08:00", "fin": "12:00", "disponible": false}
}';

-- Migrar datos de tecnicos a user_profiles
UPDATE user_profiles 
SET especialidades = t.especialidades,
    disponibilidad = t.disponibilidad
FROM tecnicos t 
WHERE user_profiles.name = t.nombre 
  AND user_profiles.role = 'tecnico';

-- Eliminar tabla tecnicos
DROP TABLE tecnicos;
```

#### **Opción B: Usar Solo `tecnicos` con FK a `user_profiles`**
```sql
-- Agregar FK a user_profiles
ALTER TABLE tecnicos 
ADD COLUMN user_profile_id UUID REFERENCES user_profiles(id);

-- Actualizar mantenimientos para usar FK
ALTER TABLE mantenimientos 
ALTER COLUMN tecnico_asignado TYPE UUID USING NULL,
ADD CONSTRAINT fk_tecnico_asignado 
FOREIGN KEY (tecnico_asignado) REFERENCES tecnicos(id);
```

### **🤖 PRIORIDAD MEDIA - Asignación Inteligente**

```typescript
interface AsignacionInteligente {
  equipoId: string;
  tipoMantenimiento: 'Preventivo' | 'Correctivo' | 'Emergencia';
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  fechaProgramada: Date;
  ubicacion: string;
  especialidadRequerida?: string;
}

async function asignarTecnicoAutomatico(criterios: AsignacionInteligente): Promise<string | null> {
  // 1. Filtrar técnicos por especialidad
  const tecnicosEspecializados = await getTecnicosPorEspecialidad(criterios.especialidadRequerida);
  
  // 2. Verificar disponibilidad en fecha/hora
  const tecnicosDisponibles = await verificarDisponibilidad(tecnicosEspecializados, criterios.fechaProgramada);
  
  // 3. Calcular distancia/ubicación
  const tecnicosOrdenados = await ordenarPorProximidad(tecnicosDisponibles, criterios.ubicacion);
  
  // 4. Considerar carga de trabajo actual
  const tecnicoOptimo = await seleccionarPorCargaTrabajo(tecnicosOrdenados);
  
  return tecnicoOptimo?.id || null;
}
```

### **📊 PRIORIDAD MEDIA - Dashboard de Técnicos**

```typescript
interface DashboardTecnico {
  tecnicoId: string;
  nombre: string;
  especialidades: string[];
  ticketsAsignados: number;
  ticketsPendientes: number;
  ticketsCompletados: number;
  disponibilidadHoy: boolean;
  proximoTicket: Date | null;
  cargaTrabajo: 'Baja' | 'Media' | 'Alta' | 'Crítica';
}
```

### **🔔 PRIORIDAD BAJA - Notificaciones Automáticas**

```typescript
// Notificar asignación automática
async function notificarAsignacion(tecnicoId: string, ticketId: string) {
  const tecnico = await getTecnico(tecnicoId);
  const ticket = await getTicket(ticketId);
  
  await enviarWhatsApp({
    telefono: tecnico.telefono,
    mensaje: `🔧 Nuevo ticket asignado: ${ticket.titulo}\n📍 Cliente: ${ticket.cliente}\n⏰ Programado: ${ticket.fechaProgramada}\n🎯 Prioridad: ${ticket.prioridad}`
  });
}
```

## 🛠️ **Implementación Recomendada (Paso a Paso)**

### **Fase 1: Unificación (1-2 días)**
1. ✅ Migrar datos de `tecnicos` a `user_profiles`
2. ✅ Actualizar `obtenerTecnicosDisponibles()` para usar campos nuevos
3. ✅ Cambiar `tecnico_asignado` a FK UUID
4. ✅ Agregar validaciones de integridad

### **Fase 2: Disponibilidad Real (2-3 días)**
1. ✅ Implementar verificación de horarios
2. ✅ Agregar estado "ocupado" por tickets activos
3. ✅ Mostrar disponibilidad real en UI
4. ✅ Prevenir asignaciones en horarios no disponibles

### **Fase 3: Asignación Inteligente (3-5 días)**
1. ✅ Algoritmo de asignación automática
2. ✅ Consideración de especialidades
3. ✅ Optimización por ubicación
4. ✅ Balance de carga de trabajo

### **Fase 4: Dashboard y Notificaciones (2-3 días)**
1. ✅ Dashboard de técnicos
2. ✅ Notificaciones automáticas
3. ✅ Métricas de rendimiento
4. ✅ Reportes de productividad

## 🎯 **Próximo Paso Recomendado**

**Empezar con la Fase 1: Unificación del Sistema**

¿Te interesa que implemente la unificación del sistema de técnicos? Es la base para todas las demás mejoras y solucionará los problemas críticos actuales.

**Beneficios inmediatos:**
- ✅ Eliminación de duplicación de datos
- ✅ Disponibilidad real de técnicos
- ✅ Base sólida para asignación inteligente
- ✅ Mejor experiencia de usuario

¿Empezamos con esto? 🚀