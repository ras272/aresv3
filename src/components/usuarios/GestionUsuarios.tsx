'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  UserCheck, 
  UserX,
  Shield,
  Mail,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, UserRole } from '@/types/auth';
import { getAllRealUsers, createRealUser, updateRealUser } from '@/lib/auth-real';
import { getCurrentUser } from '@/hooks/useAuth';

const ROLES: { value: UserRole; label: string; color: sring }[] = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-red-100 text-red-800' },
  { value: 'admin', label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
  { value: 'gerente', label: 'Gerente', color: 'bg-blue-100 text-blue-800' },
  { value: 'contabilidad', label: 'Contabilidad', color: 'bg-green-100 text-green-800' },
  { value: 'tecnico', label: 'Técnico', color: 'bg-orange-100 text-orange-800' },
  { value: 'vendedor', label: 'Vendedor', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'cliente', label: 'Cliente', color: 'bg-gray-100 text-gray-800' }
];

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<User | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'tecnico' as UserRole,
    password: ''
  });

  // Cargar usuarios
  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const usuariosData = await getAllRealUsers();
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.role.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Abrir modal para crear/editar
  const abrirModal = (usuario?: User) => {
    if (usuario) {
      setUsuarioEditando(usuario);
      setFormData({
        nombre: usuario.name,
        email: usuario.email,
        rol: usuario.role,
        password: ''
      });
    } else {
      setUsuarioEditando(null);
      setFormData({
        nombre: '',
        email: '',
        rol: 'tecnico',
        password: ''
      });
    }
    setModalAbierto(true);
  };

  // Guardar usuario
  const guardarUsuario = async () => {
    try {
      if (!formData.nombre || !formData.email) {
        toast.error('Completa todos los campos obligatorios');
        return;
      }

      if (usuarioEditando) {
        // Actualizar usuario existente
        const result = await updateRealUser(usuarioEditando.id, {
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol
        });

        if (result.success) {
          toast.success('Usuario actualizado exitosamente');
          
          // ✅ Sistema JWT moderno maneja automáticamente la actualización de datos del usuario
          
          await cargarUsuarios();
          setModalAbierto(false);
        } else {
          toast.error(result.error || 'Error actualizando usuario');
        }
      } else {
        // Crear nuevo usuario
        const result = await createRealUser({
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          password: formData.password || 'demo123'
        });

        if (result.success) {
          toast.success('Usuario creado exitosamente');
          await cargarUsuarios();
          setModalAbierto(false);
        } else {
          toast.error(result.error || 'Error creando usuario');
        }
      }
    } catch (error) {
      console.error('Error guardando usuario:', error);
      toast.error('Error guardando usuario');
    }
  };

  // Cambiar estado activo/inactivo
  const toggleUsuarioActivo = async (usuario: User) => {
    try {
      const result = await updateRealUser(usuario.id, {
        activo: !usuario.isActive
      });

      if (result.success) {
        toast.success(`Usuario ${!usuario.isActive ? 'activado' : 'desactivado'} exitosamente`);
        await cargarUsuarios();
      } else {
        toast.error(result.error || 'Error actualizando usuario');
      }
    } catch (error) {
      console.error('Error actualizando estado del usuario:', error);
      toast.error('Error actualizando usuario');
    }
  };

  const getRolInfo = (rol: UserRole) => {
    return ROLES.find(r => r.value === rol) || ROLES[4]; // Default a técnico
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600">
            Administra los usuarios del sistema ({usuarios.length} usuarios)
          </p>
        </div>

        <Button onClick={() => abrirModal()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, email o rol..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      <div className="grid gap-4">
        {usuariosFiltrados.map((usuario) => {
          const rolInfo = getRolInfo(usuario.role);
          
          return (
            <motion.div
              key={usuario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${rolInfo.color}`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {usuario.name}
                        {!usuario.isActive && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            Inactivo
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {usuario.email}
                        </div>
                        {usuario.lastLogin && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Último acceso: {new Date(usuario.lastLogin).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={rolInfo.color}>
                      {rolInfo.label}
                    </Badge>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirModal(usuario)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUsuarioActivo(usuario)}
                        className={usuario.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {usuario.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {usuariosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
          <p className="text-gray-600">
            {busqueda ? 'Intenta con otros términos de búsqueda' : 'Crea el primer usuario del sistema'}
          </p>
        </div>
      )}

      {/* Modal crear/editar usuario */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez - Técnico"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan@arestech.com"
              />
            </div>

            <div>
              <Label htmlFor="rol">Rol *</Label>
              <Select value={formData.rol} onValueChange={(value) => setFormData({ ...formData, rol: value as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((rol) => (
                    <SelectItem key={rol.value} value={rol.value}>
                      {rol.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!usuarioEditando && (
              <div>
                <Label htmlFor="password">Contraseña inicial</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="demo123 (por defecto)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si no especificas una contraseña, se usará "demo123"
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={guardarUsuario} className="flex-1">
                {usuarioEditando ? 'Actualizar' : 'Crear'} Usuario
              </Button>
              <Button variant="outline" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}