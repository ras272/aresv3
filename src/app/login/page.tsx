'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Heart, Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { AresLoader } from '@/components/ui/ares-loader';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAppStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('¡Bienvenido al sistema!');
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const usuariosDemo = [
    {
      nombre: 'Super Administrador',
      email: 'superadmin@arestech.com',
      rol: 'Super Admin',
      descripcion: 'Acceso completo a todo el sistema',
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    },
    {
      nombre: 'María González',
      email: 'contabilidad@arestech.com',
      rol: 'Contabilidad',
      descripcion: 'Facturación, archivos, documentos, clínicas, tareas',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    {
      nombre: 'Javier López',
      email: 'tecnico@arestech.com',
      rol: 'Técnico',
      descripcion: 'Dashboard, equipos, inventario, calendario (solo lectura)',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Panel de Login */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/logo-ares.png" 
                alt="ARES Paraguay" 
                className="h-20 w-auto object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ARES Paraguay</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sistema de Servicio Técnico</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="usuario@arestech.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <AresLoader size="sm" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Para la demo, cualquier contraseña es válida</p>
          </div>
        </motion.div>

        {/* Panel de Usuarios Demo */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Usuarios de Demostración</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Selecciona uno de estos usuarios para probar diferentes niveles de acceso:
          </p>

          <div className="space-y-4">
            {usuariosDemo.map((usuario, index) => (
              <motion.div
                key={usuario.email}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => {
                  setEmail(usuario.email);
                  setPassword('demo');
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{usuario.nombre}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{usuario.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{usuario.descripcion}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${usuario.color}`}>
                    {usuario.rol}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Cómo probar</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Haz clic en cualquier usuario para autocompletar</li>
              <li>• Usa cualquier contraseña (es solo una demo)</li>
              <li>• Observa cómo cambia el menú según el rol</li>
              <li>• Prueba diferentes funcionalidades por rol</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}