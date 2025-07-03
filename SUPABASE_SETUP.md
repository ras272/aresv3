# 🗄️ Configuración de Supabase para ARES-SERV

## 🚀 **PASO A PASO: Configurar tu Base de Datos**

### **1. Crear Proyecto en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Click en "Start your project" 
3. Inicia sesión con GitHub o crea una cuenta
4. Click en "New project"
5. Llena los datos:
   - **Organization**: Tu organización o crea una nueva
   - **Name**: `ares-paraguay-sistema`
   - **Database Password**: Crea una contraseña segura ⚠️ **¡GUÁRDALA!**
   - **Region**: South America (São Paulo) - `sa-east-1`
6. Click "Create new project"
7. **Espera 2-3 minutos** mientras Supabase crea tu base de datos

### **2. Obtener Credenciales**
Una vez creado el proyecto:

1. Ve a **Settings** → **API**
2. Copia estos valores:

```env
Project URL: https://abcdefghijk.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **3. Configurar Variables de Entorno**
Crea un archivo `.env.local` en la raíz de tu proyecto:

```env
# Archivo: .env.local
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:**
- Reemplaza `tu-proyecto-id` con tu URL real
- Reemplaza la key con tu clave anónima real
- NO subas este archivo a GitHub (ya está en .gitignore)

### **4. Crear las Tablas**
1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Copia y pega **TODO** el contenido del archivo `supabase/schema.sql`
3. Click en "Run" para ejecutar el script
4. Verifica que las tablas se crearon en **Table Editor**

### **5. Verificar la Instalación**
Deberías ver estas tablas:
- ✅ `cargas_mercaderia`
- ✅ `productos_carga` 
- ✅ `subitems`
- ✅ `equipos`
- ✅ `componentes_equipo`
- ✅ `mantenimientos`

### **6. Datos de Ejemplo**
El script SQL ya incluye datos de ejemplo:
- 2 cargas de mercadería
- Productos mixtos (equipos médicos, insumos, repuestos)
- 1 equipo médico en servicio técnico
- Componentes y subitems

## 🔧 **CONFIGURACIÓN ADICIONAL**

### **Actualizar Componentes para usar Supabase**

Ahora necesitas actualizar algunos componentes. Primero, el componente de la página de mercaderías:

```typescript
// src/app/mercaderias/page.tsx - Actualización necesaria
import { useEffect, useState } from 'react';

export default function MercaderiasPage() {
  const [estadisticas, setEstadisticas] = useState({
    totalCargas: 0,
    cargasHoy: 0, 
    totalProductos: 0,
    equiposMedicos: 0
  });
  
  const { getEstadisticas, loadAllData } = useAppStore();

  useEffect(() => {
    // Cargar datos al inicializar
    loadAllData();
    
    // Cargar estadísticas
    getEstadisticas().then(setEstadisticas);
  }, []);

  // ... resto del componente
}
```

### **Formulario de Carga - Actualización**

```typescript
// src/components/mercaderias/FormularioCarga.tsx - onSubmit actualizado
const onSubmit = async (data: CargaMercaderiaFormData) => {
  try {
    const nuevaCarga = await addCargaMercaderia(data);
    
    const equiposMedicos = data.productos.filter(p => p.tipoProducto === 'Equipo Médico').length;
    
    toast.success(`¡Carga registrada exitosamente!`, {
      description: `Código: ${nuevaCarga.codigoCarga}. ${data.productos.length} productos registrados. ${equiposMedicos > 0 ? `${equiposMedicos} equipo(s) médico(s) enviado(s) a Servicio Técnico.` : ''}`
    });
    
    onClose();
  } catch (error) {
    toast.error('Error al registrar la carga', {
      description: 'Por favor, intenta nuevamente.'
    });
  }
};
```

## 🧪 **PRUEBAS**

### **1. Probar Conexión**
1. Ejecuta `npm run dev`
2. Ve a `/mercaderias`
3. Deberías ver los datos de ejemplo
4. Verifica en la consola: "✅ Datos cargados exitosamente"

### **2. Probar Funcionalidad**
1. **Crear Nueva Carga**:
   - Click "Nueva Carga"
   - Llena los datos
   - Agrega múltiples productos
   - Guarda
   
2. **Verificar en Supabase**:
   - Ve a **Table Editor** → `cargas_mercaderia`
   - Deberías ver tu nueva carga
   - Verifica productos en `productos_carga`
   - Si agregaste equipo médico, verifica en `equipos`

### **3. Verificar Integración Automática**
1. Crea una carga con un "Equipo Médico"
2. Agrega subitems al equipo
3. Guarda la carga
4. Ve a **Table Editor** → `equipos`
5. Deberías ver el equipo creado automáticamente
6. Ve a `componentes_equipo` para ver los subitems

## ⚠️ **TROUBLESHOOTING**

### **Error: "Invalid API Key"**
- Verifica que las variables en `.env.local` sean correctas
- Reinicia el servidor de desarrollo (`npm run dev`)

### **Error: "Connection refused"**
- Verifica que tu proyecto de Supabase esté activo
- Verifica la URL en las variables de entorno

### **Error: "Table doesn't exist"**
- Ejecuta el script SQL completo en Supabase
- Verifica que todas las tablas se crearon

### **No se cargan datos**
- Abre la consola del navegador
- Busca errores de conexión
- Verifica que el script SQL se ejecutó correctamente

## 🎯 **SIGUIENTE PASO**

Una vez configurado Supabase:

1. ✅ Reinicia tu servidor: `npm run dev`
2. ✅ Ve a `/mercaderias`
3. ✅ Verifica que carga datos desde Supabase
4. ✅ Prueba crear una nueva carga
5. ✅ Verifica la integración automática con Servicio Técnico

## 🔒 **SEGURIDAD**

**Para Producción (más adelante):**
- Configurar Row Level Security (RLS) más restrictivo
- Crear roles de usuario específicos
- Implementar autenticación
- Configurar políticas de acceso por cliente

**Por ahora**: Las políticas están en modo permisivo para desarrollo.

---

**¡Tu sistema ARES-SERV estará 100% funcional con base de datos real!** 🚀

¿Necesitas ayuda con algún paso específico? 