# 🔐 Sistema de Roles - Ares Paraguay

## Resumen del Sistema Implementado

Se ha implementado un sistema completo de roles y permisos para el sistema Ares Paraguay con 3 roles específicos según los requerimientos.

## 🎭 Roles Definidos

### 1. Super Admin
- **Email**: `superadmin@arestech.com`
- **Acceso**: Completo a absolutamente todo el sistema
- **Permisos**: Lectura y escritura en todos los módulos
- **Color**: Rojo (indica máximo nivel de acceso)

### 2. Contabilidad
- **Email**: `contabilidad@arestech.com`
- **Acceso**: Facturación, Sistema de Archivos, Gestión Documental, Clínicas, Tareas
- **Permisos específicos**:
  - ✅ **Facturación**: Lectura y escritura
  - ✅ **Sistema de Archivos**: Lectura y escritura
  - ✅ **Gestión Documental**: Lectura y escritura
  - ✅ **Clínicas**: Lectura y escritura
  - ✅ **Tareas**: Lectura y escritura
  - ✅ **Dashboard**: Solo lectura
  - ✅ **Reportes**: Solo lectura
  - ❌ **Equipos, Inventario, Calendario, etc.**: Sin acceso
- **Color**: Azul

### 3. Técnico
- **Email**: `tecnico@arestech.com`
- **Acceso**: Dashboard, Equipos, Inventario Técnico, Calendario (todos en modo solo lectura excepto calendario)
- **Permisos específicos**:
  - ✅ **Dashboard**: Solo lectura
  - ✅ **Equipos**: Solo lectura (sin poder editar o crear)
  - ✅ **Inventario Técnico**: Solo lectura (sin opción de editar ni eliminar)
  - ✅ **Calendario**: Lectura y escritura
  - ❌ **Todos los demás módulos**: Sin acceso
- **Color**: Verde

## 🗄️ Base de Datos

### Tabla: `sistema_usuarios`
```sql
CREATE TABLE sistema_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) DEFAULT 'demo_password',
    rol user_role NOT NULL DEFAULT 'tecnico',
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enum: `user_role`
```sql
CREATE TYPE user_role AS ENUM (
    'super_admin', 
    'contabilidad', 
    'tecnico',
    'admin',      -- legacy
    'gerente',    -- legacy
    'vendedor',   -- legacy
    'cliente'     -- legacy
);
```

## 🚀 Cómo Probar el Sistema

### 1. Acceder al Login
- Ve a: `http://localhost:3000/login`
- La página mostrará los 3 usuarios disponibles para prueba

### 2. Probar cada Rol

#### Super Admin
1. Haz clic en "Super Administrador" o ingresa `superadmin@arestech.com`
2. Usa cualquier contraseña (es demo)
3. **Verifica**: Deberías ver TODOS los elementos del menú
4. **Prueba**: Accede a cualquier sección y verifica que puedes leer y escribir

#### Contabilidad
1. Haz clic en "María González - Contabilidad" o ingresa `contabilidad@arestech.com`
2. **Verifica**: Solo deberías ver en el menú:
   - Dashboard
   - Gestión Documental
   - Facturación
   - Sistema de Archivos
   - Tareas
   - Clínicas
   - Análisis (reportes)
3. **Prueba**: Intenta acceder a `/equipos` directamente - deberías ver un mensaje de acceso restringido

#### Técnico
1. Haz clic en "Javier López - Técnico" o ingresa `tecnico@arestech.com`
2. **Verifica**: Solo deberías ver en el menú:
   - Dashboard
   - Equipos
   - Inventario Técnico
   - Calendario
3. **Prueba**: 
   - Ve a Equipos - deberías poder ver pero no editar
   - Ve a Calendario - deberías poder crear/editar eventos
   - Intenta acceder a `/facturacion` - acceso restringido

### 3. Verificar Funcionalidades

#### Navegación Dinámica
- El menú lateral se filtra automáticamente según el rol
- Los elementos que requieren permisos de escritura se ocultan si el usuario solo tiene lectura

#### Información del Usuario
- En el sidebar inferior se muestra:
  - Nombre del usuario
  - Email
  - Rol con color distintivo
  - Botón de logout

#### Protección de Rutas
- Si intentas acceder a una URL sin permisos, verás un mensaje de acceso restringido
- Si no estás logueado, serás redirigido automáticamente al login

## 🛠️ Implementación Técnica

### Componentes Clave

1. **AuthGuard** (`/src/components/AuthGuard.tsx`)
   - Protege todas las rutas
   - Redirige a login si no hay usuario
   - Maneja el estado de carga

2. **PermissionGuard** (`/src/components/PermissionGuard.tsx`)
   - Protege componentes específicos
   - Muestra mensajes de acceso restringido
   - Hook `usePermissions()` para usar en componentes

3. **Sidebar** (`/src/components/layout/Sidebar.tsx`)
   - Navegación filtrada por permisos
   - Información del usuario
   - Botón de logout

### Store (Zustand)

```typescript
// Funciones principales
loadUsuarios()           // Carga usuarios desde Supabase
login(email, password)   // Autentica usuario
logout()                 // Cierra sesión
getCurrentUser()         // Usuario actual
hasPermission(modulo)    // Verifica permiso de lectura
hasWritePermission(modulo) // Verifica permiso de escritura
getUserPermissions(rol)  // Obtiene todos los permisos del rol
```

### Tipos TypeScript

```typescript
interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'super_admin' | 'contabilidad' | 'tecnico';
  activo: boolean;
  // ...
}

interface PermisosModulo {
  leer: boolean;
  escribir: boolean;
}

interface PermisosRol {
  dashboard: PermisosModulo;
  equipos: PermisosModulo;
  // ... todos los módulos
}
```

## 🔧 Uso en Componentes

### Proteger una página completa
```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

export default function EquiposPage() {
  return (
    <PermissionGuard permission="equipos">
      <div>Contenido de equipos...</div>
    </PermissionGuard>
  );
}
```

### Proteger funcionalidad de escritura
```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

export default function EquiposPage() {
  return (
    <div>
      <h1>Lista de Equipos</h1>
      
      {/* Todos pueden ver la lista */}
      <EquiposList />
      
      {/* Solo quien tenga permisos de escritura puede crear */}
      <PermissionGuard permission="equipos" requireWrite>
        <CreateEquipoButton />
      </PermissionGuard>
    </div>
  );
}
```

### Usar hook de permisos
```tsx
import { usePermissions } from '@/components/PermissionGuard';

export default function MyComponent() {
  const { canRead, canWrite, getCurrentUser } = usePermissions();
  
  const user = getCurrentUser();
  const canEditEquipos = canWrite('equipos');
  
  return (
    <div>
      <p>Usuario: {user?.nombre}</p>
      {canEditEquipos && <EditButton />}
    </div>
  );
}
```

## 🎯 Características Implementadas

✅ **Autenticación completa** con base de datos  
✅ **3 roles específicos** según requerimientos  
✅ **Navegación dinámica** filtrada por permisos  
✅ **Protección de rutas** automática  
✅ **Componentes de protección** reutilizables  
✅ **UI/UX intuitiva** con mensajes claros  
✅ **Información del usuario** visible  
✅ **Logout funcional**  
✅ **Página de login** con usuarios demo  
✅ **Sistema de permisos granular** (lectura/escritura)  
✅ **TypeScript completo** con tipos seguros  

## 🚨 Notas de Seguridad

- **Para DEMO**: Las contraseñas no se validan (cualquier contraseña funciona)
- **Para PRODUCCIÓN**: Implementar hash de contraseñas con bcrypt
- **Para PRODUCCIÓN**: Agregar tokens JWT con expiración
- **Para PRODUCCIÓN**: Implementar rate limiting en login
- **Para PRODUCCIÓN**: Agregar logs de auditoría

## 📝 Próximos Pasos Sugeridos

1. **Implementar hash de contraseñas** con bcrypt
2. **Agregar más roles** si es necesario
3. **Implementar permisos a nivel de registro** (RLS en Supabase)
4. **Agregar logs de auditoría** para acciones importantes
5. **Implementar sesiones con expiración** automática
6. **Agregar recuperación de contraseña**
7. **Implementar 2FA** para roles críticos

---

**¡El sistema está listo para usar!** 🎉

Simplemente ejecuta `npm run dev` y ve a `/login` para probar los diferentes roles.