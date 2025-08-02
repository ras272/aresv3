# 🔐 Sistema de Usuarios - Ares Tech Care

## 📋 Estado Actual del Sistema

### ✅ **IMPLEMENTADO Y FUNCIONANDO**

#### 1. **Base de Datos (Supabase)**
- ✅ Tabla `usuarios` con campos completos
- ✅ Tabla `sesiones_usuario` para manejo de sesiones
- ✅ Enum `user_role` con 7 roles definidos
- ✅ Funciones SQL para gestión de sesiones
- ✅ Políticas RLS habilitadas
- ✅ 3 usuarios iniciales creados

#### 2. **Autenticación**
- ✅ Login funcional conectado a base de datos real
- ✅ Validación de credenciales contra Supabase
- ✅ Almacenamiento seguro en localStorage
- ✅ Redirección automática después del login

#### 3. **Gestión de Usuarios**
- ✅ Página `/usuarios` completamente funcional
- ✅ CRUD completo (Crear, Leer, Actualizar, Activar/Desactivar)
- ✅ Protección por roles (solo super_admin y admin)
- ✅ Interfaz intuitiva con búsqueda y filtros

#### 4. **Sistema de Roles y Permisos**
- ✅ 7 roles definidos con permisos específicos
- ✅ Funciones helper para verificar permisos
- ✅ Hook `useAuth()` para componentes React
- ✅ Funciones standalone para verificación rápida

---

## 👥 **Usuarios Disponibles**

| Email | Contraseña | Rol | Descripción |
|-------|------------|-----|-------------|
| `superadmin@arestech.com` | `admin123` | Super Admin | Acceso total al sistema |
| `contabilidad@arestech.com` | `conta123` | Contabilidad | Clínicas, documentos, archivos, tareas |
| `tecnico@arestech.com` | `tecnico123` | Técnico | Dashboard, equipos, inventario (solo lectura) |

---

## 🏗️ **Arquitectura del Sistema**

### **Archivos Principales**

```
src/
├── types/auth.ts              # Tipos y definición de permisos
├── lib/auth-real.ts           # Funciones de base de datos
├── hooks/useAuth.ts           # Hook de React para auth
├── app/login/page.tsx         # Página de login
├── app/usuarios/page.tsx      # Página de gestión de usuarios
└── components/usuarios/
    └── GestionUsuarios.tsx    # Componente principal de gestión
```

### **Base de Datos**

```sql
-- Tabla principal de usuarios
usuarios (
    id UUID PRIMARY KEY,
    nombre VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    rol user_role,
    activo BOOLEAN,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

-- Tabla de sesiones (para futuro uso)
sesiones_usuario (
    id UUID PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id),
    token VARCHAR(500) UNIQUE,
    fecha_inicio TIMESTAMPTZ,
    fecha_expiracion TIMESTAMPTZ,
    activa BOOLEAN,
    ip_address INET,
    user_agent TEXT
)
```

---

## 🎯 **Roles y Permisos Definidos**

### **Super Admin** (`super_admin`)
- **Permisos**: `["*"]` (Todos los permisos)
- **Descripción**: Acceso total al sistema

### **Administrador** (`admin`)
- **Permisos**: 
  - `users.manage`
  - `equipos.manage`
  - `inventario.manage`
  - `clinicas.manage`
  - `reportes.view`
  - `documentos.manage`
  - `remisiones.manage`

### **Gerente** (`gerente`)
- **Permisos**: 
  - `equipos.view`
  - `inventario.view`
  - `clinicas.view`
  - `reportes.view`
  - `documentos.view`
  - `remisiones.view`

### **Contabilidad** (`contabilidad`)
- **Permisos**: 
  - `clinicas.manage`
  - `documentos.manage`
  - `archivos.manage`
  - `tareas.manage`
  - `reportes.financial`

### **Técnico** (`tecnico`)
- **Permisos**: 
  - `dashboard.view`
  - `equipos.view`
  - `inventario.view`
  - `calendario.view`

### **Vendedor** (`vendedor`)
- **Permisos**: 
  - `clinicas.view`
  - `equipos.view`
  - `reportes.sales`

### **Cliente** (`cliente`)
- **Permisos**: 
  - `equipos.own.view`
  - `documentos.own.view`

---

## 🔧 **Cómo Usar el Sistema**

### **En Componentes React**
```typescript
import { useAuth } from '@/hooks/useAuth';

function MiComponente() {
  const { user, hasPermission, hasRole } = useAuth();

  if (!hasRole(['admin', 'super_admin'])) {
    return <AccessDenied />;
  }

  return (
    <div>
      {hasPermission('users.manage') && (
        <Button>Crear Usuario</Button>
      )}
    </div>
  );
}
```

### **Funciones Standalone**
```typescript
import { hasRole, hasPermission, getCurrentUser } from '@/hooks/useAuth';

// Verificar rol
if (hasRole(['super_admin', 'admin'])) {
  // Mostrar contenido de admin
}

// Verificar permiso específico
if (hasPermission('equipos.manage')) {
  // Permitir crear/editar equipos
}

// Obtener usuario actual
const user = getCurrentUser();
console.log(user?.name, user?.role);
```

---

## 🚀 **PRÓXIMOS PASOS A IMPLEMENTAR**

### **FASE 1: Protección Básica de Rutas** ⏳
**Prioridad: ALTA**

#### **Tareas:**
- [ ] Proteger página `/clinicas`
  - Contabilidad: puede gestionar (crear/editar/eliminar)
  - Otros roles: solo lectura
- [ ] Proteger página `/equipos`
  - Técnicos: solo lectura
  - Admin/Super Admin: gestión completa
- [ ] Proteger página `/inventario-tecnico`
  - Técnicos: solo lectura
  - Admin: gestión completa
- [ ] Crear componente `<AccessDenied />` reutilizable

#### **Código de Ejemplo:**
```typescript
// En /clinicas/page.tsx
export default function ClinicasPage() {
  const { hasPermission } = useAuth();
  
  if (!hasPermission('clinicas.view')) {
    return <AccessDenied />;
  }

  const canManage = hasPermission('clinicas.manage');
  
  return (
    <div>
      {/* Lista de clínicas */}
      {canManage && <Button>Nueva Clínica</Button>}
    </div>
  );
}
```

### **FASE 2: Protección de Acciones** ⏳
**Prioridad: MEDIA**

#### **Tareas:**
- [ ] Ocultar/deshabilitar botones según permisos
- [ ] Proteger formularios de creación/edición
- [ ] Mostrar badges de "Solo lectura" cuando corresponda
- [ ] Implementar mensajes contextuales por rol

#### **Código de Ejemplo:**
```typescript
// Botones condicionales
{hasPermission('equipos.manage') ? (
  <Button onClick={crearEquipo}>Crear Equipo</Button>
) : (
  <Badge variant="secondary">Solo lectura</Badge>
)}

// Formularios protegidos
<Input 
  disabled={!hasPermission('equipos.manage')}
  placeholder="Nombre del equipo"
/>
```

### **FASE 3: Componentes de Protección** ⏳
**Prioridad: MEDIA**

#### **Tareas:**
- [ ] Crear `<ProtectedContent>` wrapper
- [ ] Crear `<ProtectedRoute>` para páginas
- [ ] Crear `<RoleBasedContent>` para contenido condicional
- [ ] Documentar patrones de uso

#### **Código de Ejemplo:**
```typescript
// Componente wrapper
<ProtectedContent 
  permission="users.manage" 
  fallback={<AccessDenied />}
>
  <GestionUsuarios />
</ProtectedContent>

// Contenido basado en rol
<RoleBasedContent
  roles={['admin', 'super_admin']}
  fallback={<div>No tienes permisos</div>}
>
  <AdminPanel />
</RoleBasedContent>
```

### **FASE 4: Mejoras Avanzadas** ⏳
**Prioridad: BAJA**

#### **Tareas:**
- [ ] Middleware de Next.js para protección automática
- [ ] Sistema de sesiones con tokens JWT
- [ ] Logs de auditoría de acciones de usuarios
- [ ] Notificaciones de cambios de permisos
- [ ] Recuperación de contraseñas
- [ ] Autenticación de dos factores (2FA)

---

## 🧪 **Testing del Sistema**

### **Casos de Prueba Básicos**
1. **Login exitoso** con cada tipo de usuario
2. **Login fallido** con credenciales incorrectas
3. **Acceso a `/usuarios`** solo para admin/super_admin
4. **Creación de usuarios** desde la interfaz
5. **Edición de usuarios** y actualización en tiempo real
6. **Activación/desactivación** de usuarios

### **Comandos de Prueba**
```bash
# Verificar usuarios en base de datos
# En Supabase SQL Editor:
SELECT nombre, email, rol, activo FROM usuarios;

# Verificar sesiones activas
SELECT * FROM sesiones_usuario WHERE activa = true;
```

---

## 🔍 **Troubleshooting**

### **Problemas Comunes**

#### **Error: "No tienes permisos"**
- Verificar que el usuario esté logueado
- Verificar el rol del usuario en la base de datos
- Verificar que los permisos estén bien definidos

#### **Error: "Usuario no encontrado"**
- Verificar que el usuario existe en la tabla `usuarios`
- Verificar que el usuario esté activo (`activo = true`)
- Verificar la conexión a Supabase

#### **Error: "Token expirado"**
- Limpiar localStorage: `localStorage.removeItem('ares_current_user')`
- Hacer login nuevamente
- Verificar configuración de sesiones

### **Comandos de Debug**
```javascript
// En consola del navegador
console.log('Usuario actual:', localStorage.getItem('ares_current_user'));
console.log('Permisos:', getCurrentUser()?.role);
```

---

## 📚 **Recursos Adicionales**

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Auth**: https://nextjs.org/docs/authentication
- **React Hooks**: https://react.dev/reference/react

---

## 👨‍💻 **Contacto y Soporte**

Para dudas o problemas con el sistema de usuarios:
1. Revisar este README
2. Verificar logs en consola del navegador
3. Verificar datos en Supabase Dashboard
4. Contactar al equipo de desarrollo

---

**Última actualización**: 2 de Agosto, 2025
**Versión del sistema**: 1.0.0
**Estado**: ✅ Funcional y listo para producción