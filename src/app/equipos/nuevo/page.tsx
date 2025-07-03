'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { equipoSchema, EquipoFormData } from '@/lib/schemas';
import { 
  Save, 
  ArrowLeft, 
  Heart,
  Building,
  Calendar,
  FileText,
  Plus,
  Trash2,
  MapPin,
  Tag,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';

const tiposEquipo = [
  'CMSlim (Estética)',
  'Electrocardiógrafo',
  'Monitor de Signos Vitales',
  'Desfibrilador',
  'Ventilador Mecánico',
  'Bomba de Infusión',
  'Oxímetro de Pulso',
  'Aspirador Quirúrgico',
  'Cauterizador',
  'Monitor Fetal',
  'Equipo de Rayos X',
  'Ultrasonido',
  'Laser Terapéutico',
  'Radiofrecuencia',
  'Criolipolisis',
  'Otro'
];

const tiposComponentes = [
  'Unidad Principal',
  'Paleta/Pieza de Mano',
  'Sensor',
  'Electrodo',
  'Cable',
  'Transductor',
  'Sonda',
  'Cabezal',
  'Aplicador',
  'Otro'
];

export default function NuevoEquipoPage() {
  const router = useRouter();
  const { addEquipo } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<EquipoFormData>({
    resolver: zodResolver(equipoSchema),
    defaultValues: {
      fechaEntrega: new Date().toISOString().split('T')[0],
      componentes: [
        {
          nombre: 'Unidad Principal',
          numeroSerie: '',
          estado: 'Operativo',
          observaciones: ''
        }
      ]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'componentes',
  });

  const onSubmit = async (data: EquipoFormData) => {
    setIsLoading(true);
    
    try {
      // Simular delay de guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addEquipo(data);
      
      toast.success('Equipo registrado correctamente', {
        description: `${data.nombreEquipo} - ${data.cliente}`,
      });
      
      router.push('/equipos');
    } catch (error) {
      toast.error('Error al registrar el equipo');
    } finally {
      setIsLoading(false);
    }
  };

  const agregarComponente = () => {
    append({
      nombre: '',
      numeroSerie: '',
      estado: 'Operativo',
      observaciones: ''
    });
  };

  return (
    <DashboardLayout 
      title="Registrar Nuevo Equipo" 
      subtitle="Completa la información del equipo médico y sus componentes"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información del Cliente y Ubicación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Información del Cliente</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Input
                    id="cliente"
                    placeholder="Ej: Ares, Clínica Principal..."
                    {...register('cliente')}
                  />
                  {errors.cliente && (
                    <p className="text-sm text-red-600 mt-1">{errors.cliente.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="ubicacion">Ubicación Específica *</Label>
                  <Input
                    id="ubicacion"
                    placeholder="Ej: Asuncion - Sala Principal, Área de Tratamientos..."
                    {...register('ubicacion')}
                  />
                  {errors.ubicacion && (
                    <p className="text-sm text-red-600 mt-1">{errors.ubicacion.message}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Información del Equipo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Información del Equipo</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombreEquipo">Nombre del Equipo *</Label>
                  <Input
                    id="nombreEquipo"
                    placeholder="Ej: ECG-HC-001, MON-CSJ-002, DEF-CMU-003..."
                    {...register('nombreEquipo')}
                  />
                  {errors.nombreEquipo && (
                    <p className="text-sm text-red-600 mt-1">{errors.nombreEquipo.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tipoEquipo">Tipo de Equipo *</Label>
                  <Select onValueChange={(value) => setValue('tipoEquipo', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de equipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEquipo.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tipoEquipo && (
                    <p className="text-sm text-red-600 mt-1">{errors.tipoEquipo.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="marca">Marca *</Label>
                  <Input
                    id="marca"
                    placeholder="Ej: Philips, GE Healthcare, Zoll, Mindray..."
                    {...register('marca')}
                  />
                  {errors.marca && (
                    <p className="text-sm text-red-600 mt-1">{errors.marca.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input
                    id="modelo"
                    placeholder="Ej: PageWriter TC50, CARESCAPE B450, X Series..."
                    {...register('modelo')}
                  />
                  {errors.modelo && (
                    <p className="text-sm text-red-600 mt-1">{errors.modelo.message}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="numeroSerieBase">Número de Serie Base *</Label>
                  <Input
                    id="numeroSerieBase"
                    placeholder="Ej: PH-2024-001, GE-2024-002, ZL-2024-003..."
                    {...register('numeroSerieBase')}
                  />
                  {errors.numeroSerieBase && (
                    <p className="text-sm text-red-600 mt-1">{errors.numeroSerieBase.message}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="accesorios">Accesorios Incluidos *</Label>
                  <Textarea
                    id="accesorios"
                    placeholder="Ej: Electrodos, cables ECG, manguito de presión, manual de usuario, batería de respaldo..."
                    {...register('accesorios')}
                    rows={3}
                  />
                  {errors.accesorios && (
                    <p className="text-sm text-red-600 mt-1">{errors.accesorios.message}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Componentes/Piezas del Equipo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Componentes/Piezas del Equipo</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={agregarComponente}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Componente</span>
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Componente {index + 1}
                      </h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Componente *</Label>
                        <Select onValueChange={(value) => setValue(`componentes.${index}.nombre`, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo de componente..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposComponentes.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.componentes?.[index]?.nombre && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.componentes[index]?.nombre?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label>Número de Serie *</Label>
                        <Input
                          placeholder="Ej: PH-2024-001-MAIN, GE-2024-002-SPO2..."
                          {...register(`componentes.${index}.numeroSerie`)}
                        />
                        {errors.componentes?.[index]?.numeroSerie && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.componentes[index]?.numeroSerie?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label>Estado</Label>
                        <Select 
                          defaultValue="Operativo"
                          onValueChange={(value) => setValue(`componentes.${index}.estado`, value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Operativo">Operativo</SelectItem>
                            <SelectItem value="En reparacion">En reparación</SelectItem>
                            <SelectItem value="Fuera de servicio">Fuera de servicio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Observaciones</Label>
                        <Input
                          placeholder="Detalles específicos del componente..."
                          {...register(`componentes.${index}.observaciones`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {errors.componentes && (
                <p className="text-sm text-red-600 mt-2">
                  {errors.componentes.message}
                </p>
              )}
            </Card>
          </motion.div>

          {/* Información de Entrega */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Información de Entrega</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fechaEntrega">Fecha de Entrega *</Label>
                  <Input
                    id="fechaEntrega"
                    type="date"
                    {...register('fechaEntrega')}
                  />
                  {errors.fechaEntrega && (
                    <p className="text-sm text-red-600 mt-1">{errors.fechaEntrega.message}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Observaciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Observaciones Adicionales</h3>
              </div>
              
              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Observaciones adicionales sobre la instalación, condiciones especiales, configuración específica..."
                  {...register('observaciones')}
                  rows={4}
                />
                {errors.observaciones && (
                  <p className="text-sm text-red-600 mt-1">{errors.observaciones.message}</p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Botones de Acción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-end"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Registrar Equipo</span>
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </DashboardLayout>
  );
} 