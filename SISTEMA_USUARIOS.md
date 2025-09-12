# 🔐 Sistema de Usuarios - Ares Tech Care

## 📋 Estado Actual del Sistema

### ✅ **MIGRACIÓN COMPLETADA - SISTEMA JWT PURO**

#### 1. **Base de Datos (Supabase)**
- ✅ Tabla `usuarios` con campos completos
- ✅ Tabla `sesiones_usuario` para manejo de sesiones
- ✅ Enum `user_role` con 7 roles definidos
- ✅ Funciones SQL para gestión de sesiones
- ✅ Políticas RLS habilitadas
- ✅ 3 usuarios iniciales creados

#### 2. **Autenticación con JWT (Sistema Moderno)**
- ✅ Login funcional conectado a base de datos real
- ✅ Validación de credenciales contra Supabase
- ✅ Almacenamiento seguro con cookies httpOnly y JWT
- ✅ Redirección automática después del login
- ✅ Sistema de refresh tokens automático
- ✅ Blacklist de tokens para logout seguro
- ✅ Middleware de autenticación en Next.js

#### 3. **Gestión de Usuarios**
- ✅ Página `/usuarios` completamente funcional
- ✅ CRUD completo (Crear, Leer, Actualizar, Activar/Desactivar)
- ✅ Protección por roles (solo super_admin y admin)
- ✅ Interfaz intuitiva con búsqueda y filtros
- ✅ Actualización automática de datos de usuario

#### 4. **Sistema de Roles y Permisos**
- ✅ 7 roles definidos con permisos específicos
- ✅ Funciones helper para verificar permisos
- ✅ Hook `useAuth()` para componentes React
- ✅ Funciones standalone para verificación rápida
- ✅ Componentes ProtectedRoute modernos

#### 5. **Componentes de Protección Modernos**
- ✅ `ProtectedRoute` - Protección básica de rutas
- ✅ `RoleGuard` - Protección basada en roles
- ✅ `PermissionGuard` - Protección basada en permisos
- ✅ `AuthProvider` - Context de autenticación completo
- ✅ Sistema de sincronización entre pestañas

#### 6. **Sidebar Dinámico por Permisos** ✨ **NUEVO**
- ✅ Navegación filtrada según rol del usuario
- ✅ Ocultación automática de opciones sin permisos
- ✅ Mapeo detallado de permisos a elementos del menú
- ✅ Sistema responsive con colapso

#### 7. **Páginas de Error Personalizadas** ✨ **NUEVO**
- ✅ Imagen 404.png para errores de acceso
- ✅ Página 404 personalizada (`not-found.tsx`)
- ✅ Componentes de error unificados
- ✅ Diseño consistente con el sistema

---

## 🗑️ **Componentes Eliminados (Migración Completada)**

- ❌ Sistema de localStorage legacy
- ❌ AuthGuard.tsx legacy (reemplazado por ProtectedRoute)
- ❌ Funciones de autenticación en AppStore
- ❌ Hooks useAuth legacy
- ❌ Referencias a sesionActual
- ❌ getCurrentUser del store
- ❌ Sistema de bypass temporal

---

## 👥 **Usuarios Disponibles para Testing**

| Email | Contraseña | Nombre | Rol | Estado |
|-------|------------|--------|-----|--------|
| `superadmin@ares.com` | `aresabente` | Teresa Ferres | Super Admin | ✅ Activo |
| `ceci@ares.com` | `demo123` | Ceci | Contabilidad | ✅ Activo |
| `jack@ares.com` | *(inactivo)* | Jack Green | Super Admin | ❌ Inactivo |
| `test@ares.com` | *(inactivo)* | test | Técnico | ❌ Inactivo |

**⚠️ NOTA:** Los usuarios activos son `superadmin@ares.com` y `ceci@ares.com`.

---

## 🔒 **Características de Seguridad Implementadas**

### ✅ **Seguridad de Tokens**
- Tokens JWT firmados con claves seguras
- Access tokens de 15 minutos
- Refresh tokens de 7 días
- Sistema de blacklist para logout seguro
- Renovación automática transparente

### ✅ **Protección de Cookies**
- Cookies httpOnly (no accesibles desde JavaScript)
- Flags Secure para HTTPS
- SameSite strict para CSRF protection
- Limpieza automática en logout

### ✅ **Middleware de Seguridad**
- Verificación de autenticación en cada request
- Control de acceso basado en roles
- Protección de rutas API y páginas
- Headers de seguridad automáticos

### ✅ **Sincronización Multi-Pestaña**
- Logout sincronizado entre todas las pestañas
- Estado de autenticación compartido
- Eventos de localStorage para comunicación

---

## 🏗️ **Arquitectura del Sistema**

### **Archivos Principales**

```
src/
├── types/auth.ts              # Tipos y definición completa de permisos
├── lib/auth-real.ts           # Funciones de base de datos
├── hooks/useAuth.ts           # Hook de React para auth
├── app/login/page.tsx         # Página de login
├── app/usuarios/page.tsx      # Página de gestión de usuarios
├── app/not-found.tsx          # Página 404 personalizada 🆕
├── components/usuarios/
│   └── GestionUsuarios.tsx    # Componente principal de gestión
├── components/auth/
│   ├── AuthProvider.tsx       # Context de autenticación
│   ├── UnauthorizedAccess.tsx # Componente de error con imagen 404 🆕
│   └── ProtectedRoute.tsx     # Rutas protegidas
├── components/layout/
│   └── SidebarNew.tsx         # Sidebar dinámico por permisos 🆕
└── components/
    └── PermissionGuard.tsx    # Guard de permisos con imagen 404 🆕
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
  - `dashboard.view`
  - `clinicas.view`, `clinicas.edit`
  - `documentos.view`, `documentos.create`, `documentos.edit`, `documentos.delete`
  - `archivos.view`, `archivos.upload`, `archivos.download`, `archivos.manage_folders`
  - `remisiones.view`, `remisiones.create`, `remisiones.edit`
  - `reportes.view`, `reportes.financial`, `reportes.export`
  - `mercaderias.view`, `mercaderias.create`, `mercaderias.edit`
  - `productos.view`, `productos.create`, `productos.edit`
  - `stock.view`, `stock.manage`, `stock.export`
- **Acceso**: Catálogo de Productos, Remisiones, Stock General
- **Restricciones**: NO accede a equipos, calendario, usuarios

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

### **Sidebar Dinámico por Permisos**
```typescript
// El sidebar se actualiza automáticamente según el usuario logueado
// Ejemplo: Usuario con rol 'contabilidad' verá:
// - Dashboard
// - Inventario & Stock (Mercaderías, Productos, Stock)
// - Documentos & Archivos (Documentos, Remisiones, Archivos, Reportes)
// - Administración (Clínicas)

// NO verá:
// - Equipos & Servicio
// - Usuarios (solo admins)
// - Calendario
```

### **Páginas de Error con Imagen 404**
```typescript
// Uso automático en componentes de error
<UnauthorizedAccess 
  message="No tienes permisos para esta sección"
  // Automáticamente muestra imagen 404.png
/>

// Página 404 para URLs inexistentes
// Navegación a /pagina-inexistente automáticamente muestra not-found.tsx
```

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
7. **Sidebar dinámico** - verificar que cada rol ve solo sus opciones 🆕
8. **Páginas de error** - verificar imagen 404 en accesos denegados 🆕

### **Testing por Rol** 🆕

#### **Contabilidad (ceci@ares.com)**
- ✅ Debe ver: Dashboard, Mercaderías, Productos, Stock, Documentos, Remisiones, Archivos, Reportes, Clínicas
- ❌ No debe ver: Equipos, Calendario, Usuarios, ServTec

#### **Super Admin (superadmin@ares.com)**
- ✅ Debe ver: Todas las opciones del sistema

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
- Las cookies se limpian automáticamente
- Hacer login nuevamente
- Verificar que no hay problemas con las cookies en el navegador

### **Comandos de Debug**
```javascript
// En consola del navegador
console.log('Cookies disponibles:', document.cookie);
console.log('Estado de autenticación:', Boolean(document.cookie.includes('ares_session')));
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

**Última actualización**: 29 de Agosto, 2025 🆕
**Versión del sistema**: 2.0.0 🆕
**Estado**: ✅ Funcional y listo para producción

### **🆕 Actualizaciones Recientes (v2.0.0)**
- ✨ Sistema de permisos granular completamente rediseñado
- ✨ Sidebar dinámico que se adapta según el rol del usuario
- ✨ Imagen 404.png implementada en todas las páginas de error
- ✨ Usuario Ceci (contabilidad) configurado con acceso a Stock, Productos y Remisiones
- ✨ Página 404 personalizada para URLs no encontradas
- ✨ Eliminación completa del acceso al calendario para contabilidad