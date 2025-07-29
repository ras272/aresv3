# 🚀 Guía de Deployment - Ares Demo

Esta guía te ayudará a desplegar la aplicación **Ares Demo** en Vercel y configurar GitHub.

## 📋 Requisitos Previos

- ✅ Cuenta de GitHub
- ✅ Cuenta de Vercel
- ✅ Cuenta de Supabase (para la base de datos)
- ✅ Git instalado localmente

## 🔧 Paso 1: Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto:
   - **Project Name**: `ares-demo`
   - **Database Password**: Genera una contraseña segura
   - **Region**: Selecciona la más cercana
3. Ve a **Settings** → **API**
4. Copia estos valores:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGci...`

## 📁 Paso 2: Crear Repositorio en GitHub

### Opción A: Usando GitHub Web
1. Ve a [github.com](https://github.com) y haz login
2. Clic en **"New repository"**
3. Configuración:
   - **Repository name**: `ares-demo`
   - **Description**: `Sistema de Gestión de Equipos Médicos - Ares Paraguay`
   - **Visibility**: Public (o Private si prefieres)
   - **NO marques** "Initialize with README"
4. Clic en **"Create repository"**

### Conectar repositorio local
Ejecuta estos comandos en tu terminal:

```bash
# Agregar el repositorio remoto (reemplaza TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/ares-demo.git

# Subir el código
git branch -M main
git push -u origin main
```

## 🌐 Paso 3: Deploy en Vercel

### Método 1: Deploy Automático (Recomendado)
1. Ve a [vercel.com](https://vercel.com) y haz login
2. Clic en **"New Project"**
3. **Import Git Repository**:
   - Conecta tu cuenta de GitHub
   - Selecciona el repositorio `ares-demo`
   - Clic en **"Import"**

### Método 2: Deploy Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Deploy
vercel --prod
```

## ⚙️ Paso 4: Configurar Variables de Entorno en Vercel

1. En el dashboard de Vercel, ve a tu proyecto
2. Ve a **Settings** → **Environment Variables**
3. Agrega estas variables:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Tu URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key de Supabase |
| `NEXT_PUBLIC_GROQ_API_KEY` | (Opcional) Tu API key de Groq |

4. Clic en **"Save"**
5. Ve a **Deployments** y clic en **"Redeploy"**

## 🗄️ Paso 5: Configurar Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Ejecuta el archivo `supabase/schema.sql`:
   - Copia el contenido del archivo
   - Pégalo en el editor SQL
   - Clic en **"Run"**

## ✅ Paso 6: Verificar Deployment

1. Ve a tu URL de Vercel (ej: `ares-demo.vercel.app`)
2. Verifica que la aplicación carga correctamente
3. Prueba crear un nuevo equipo
4. Verifica que los datos se guardan en Supabase

## 🔧 Configuración Adicional

### Dominio Personalizado (Opcional)
1. En Vercel, ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones

### Configurar Webhooks (Opcional)
Para deploys automáticos en cada push:
1. En GitHub, ve a tu repositorio
2. **Settings** → **Webhooks**
3. Vercel automáticamente configura esto

## 🐛 Solución de Problemas

### Error de Variables de Entorno
- Verifica que todas las variables estén configuradas en Vercel
- Asegúrate de que no tengan espacios extra
- Redeploya después de cambiar variables

### Error de Base de Datos
- Verifica que el schema de Supabase esté aplicado
- Revisa que las credenciales sean correctas
- Verifica que el proyecto de Supabase esté activo

### Error de Build
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel
- Asegúrate de que no haya errores de TypeScript

## 📊 URLs Importantes

- **Aplicación**: `https://tu-proyecto.vercel.app`
- **Vercel Dashboard**: `https://vercel.com/dashboard`
- **Supabase Dashboard**: `https://app.supabase.com`
- **GitHub Repo**: `https://github.com/tu-usuario/ares-demo`

## 🎉 ¡Listo!

Tu aplicación **Ares Demo** debería estar funcionando en:
- ✅ GitHub para control de versiones
- ✅ Vercel para hosting
- ✅ Supabase para base de datos

### Funcionalidades Activas:
- ✅ Dashboard principal
- ✅ Gestión de equipos
- ✅ Sistema de mantenimientos
- ✅ Calendario de mantenimientos
- ✅ Inventario técnico
- ✅ Cargas de mercaderías
- ✅ Reportes y estadísticas

### Sistemas Temporalmente Desactivados:
- ⏸️ Sistema de Stock (comentado)
- ⏸️ Sistema de Capacitaciones (comentado)

---

**¿Necesitas ayuda?** Revisa los logs en Vercel o Supabase para más detalles sobre cualquier error. 