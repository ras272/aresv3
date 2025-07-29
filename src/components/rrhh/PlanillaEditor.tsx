'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRRHH } from '@/hooks/useRRHH';
import { Planilla, PlanillaEmpleado } from '@/types/rrhh';
import { 
  Calculator, 
  Save, 
  Download, 
  Check, 
  Edit3, 
  DollarSign,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface PlanillaEditorProps {
  planilla: Planilla;
  onUpdate?: (planilla: Planilla) => void;
}

export function PlanillaEditor({ planilla, onUpdate }: PlanillaEditorProps) {
  const { 
    actualizarPlanillaEmpleado, 
    aprobarPlanilla, 
    formatearMoneda,
    loading 
  } = useRRHH();

  const [editingCell, setEditingCell] = useState<{
    empleadoId: string;
    field: keyof PlanillaEmpleado;
  } | null>(null);
  
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const [planillaLocal, setPlanillaLocal] = useState<Planilla>(planilla);

  // Sincronizar con props cuando cambie
  useEffect(() => {
    setPlanillaLocal(planilla);
  }, [planilla]);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Manejar edición de celda
  const handleCellEdit = useCallback((empleadoId: string, field: keyof PlanillaEmpleado, value: any) => {
    const key = `${empleadoId}-${field}`;
    setTempValues(prev => ({ ...prev, [key]: value }));
  }, []);

  // Confirmar edición
  const handleCellConfirm = useCallback(async (empleadoId: string, field: keyof PlanillaEmpleado) => {
    const key = `${empleadoId}-${field}`;
    const value = tempValues[key];
    
    if (value === undefined) return;

    try {
      // Actualizar localmente primero para UX inmediata
      setPlanillaLocal(prev => ({
        ...prev,
        empleados: prev.empleados.map(emp => 
          emp.empleadoId === empleadoId 
            ? { ...emp, [field]: field === 'diasTrabajados' || field === 'horasExtra' ? parseInt(value) || 0 : value }
            : emp
        )
      }));

      // Actualizar en el hook (esto recalculará automáticamente)
      await actualizarPlanillaEmpleado(planilla.id, empleadoId, {
        [field]: field === 'diasTrabajados' || field === 'horasExtra' ? parseInt(value) || 0 : value
      });

      setEditingCell(null);
      setTempValues(prev => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });

      // Notificar cambio al componente padre
      onUpdate?.(planillaLocal);
      
    } catch (error) {
      toast.error('Error al actualizar planilla');
      // Revertir cambio local
      setPlanillaLocal(planilla);
    }
  }, [tempValues, planilla.id, planillaLocal, actualizarPlanillaEmpleado, onUpdate]);

  // Cancelar edición
  const handleCellCancel = useCallback((empleadoId: string, field: keyof PlanillaEmpleado) => {
    const key = `${empleadoId}-${field}`;
    setTempValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
    setEditingCell(null);
  }, []);

  // Componente de celda editable
  const EditableCell = ({ 
    empleadoId, 
    field, 
    value, 
    type = 'text',
    disabled = false 
  }: {
    empleadoId: string;
    field: keyof PlanillaEmpleado;
    value: any;
    type?: 'text' | 'number';
    disabled?: boolean;
  }) => {
    const key = `${empleadoId}-${field}`;
    const isEditing = editingCell?.empleadoId === empleadoId && editingCell?.field === field;
    const tempValue = tempValues[key];
    const displayValue = tempValue !== undefined ? tempValue : value;

    if (disabled) {
      return (
        <div className="px-3 py-2 text-sm">
          {typeof value === 'number' && field !== 'diasTrabajados' && field !== 'horasExtra' 
            ? formatearMoneda(value) 
            : value}
        </div>
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type={type}
            value={tempValue || ''}
            onChange={(e) => handleCellEdit(empleadoId, field, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellConfirm(empleadoId, field);
              } else if (e.key === 'Escape') {
                handleCellCancel(empleadoId, field);
              }
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCellConfirm(empleadoId, field)}
            className="h-8 w-8 p-0"
          >
            <Check className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
        onClick={() => setEditingCell({ empleadoId, field })}
      >
        <span>
          {typeof displayValue === 'number' && field !== 'diasTrabajados' && field !== 'horasExtra' 
            ? formatearMoneda(displayValue) 
            : displayValue}
        </span>
        <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50" />
      </div>
    );
  };

  const handleAprobar = async () => {
    try {
      await aprobarPlanilla(planilla.id);
      setPlanillaLocal(prev => ({ ...prev, estado: 'aprobada' }));
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const exportarPlanilla = () => {
    // Simular exportación
    toast.success('Planilla exportada exitosamente');
  };

  const getEstadoColor = (estado: Planilla['estado']) => {
    switch (estado) {
      case 'borrador': return 'bg-yellow-100 text-yellow-800';
      case 'generada': return 'bg-blue-100 text-blue-800';
      case 'aprobada': return 'bg-green-100 text-green-800';
      case 'pagada': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de la planilla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-6 h-6 text-blue-600" />
                Planilla {meses[planillaLocal.mes - 1]} {planillaLocal.año}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge className={getEstadoColor(planillaLocal.estado)}>
                  {planillaLocal.estado.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  {planillaLocal.empleados.length} empleados
                </span>
                <span className="text-sm text-gray-600">
                  Generada: {planillaLocal.fechaGeneracion.toLocaleDateString('es-PY')}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportarPlanilla}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              
              {planillaLocal.estado === 'borrador' && (
                <Button 
                  onClick={handleAprobar}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Resumen totales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total Bruto</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatearMoneda(planillaLocal.totalBruto)}
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Total Descuentos</span>
              </div>
              <div className="text-2xl font-bold text-red-900">
                {formatearMoneda(planillaLocal.totalDescuentos)}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Total Neto</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {formatearMoneda(planillaLocal.totalNeto)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla editable de empleados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Detalle por Empleado
            {planillaLocal.estado === 'borrador' && (
              <Badge variant="outline" className="ml-2">
                Editable en tiempo real
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">Empleado</th>
                  <th className="text-left p-4 font-medium text-gray-900">Días Trab.</th>
                  <th className="text-left p-4 font-medium text-gray-900">Horas Extra</th>
                  <th className="text-left p-4 font-medium text-gray-900">Salario Base</th>
                  <th className="text-left p-4 font-medium text-gray-900">Bonificaciones</th>
                  <th className="text-left p-4 font-medium text-gray-900">Descuentos</th>
                  <th className="text-left p-4 font-medium text-gray-900">Total Neto</th>
                </tr>
              </thead>
              <tbody>
                {planillaLocal.empleados.map((empleadoPlanilla, index) => (
                  <motion.tr
                    key={empleadoPlanilla.empleadoId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-medium">
                          {empleadoPlanilla.empleado.nombre} {empleadoPlanilla.empleado.apellido}
                        </div>
                        <div className="text-sm text-gray-600">
                          {empleadoPlanilla.empleado.cargo}
                        </div>
                      </div>
                    </td>
                    
                    <td className="border-l">
                      <EditableCell
                        empleadoId={empleadoPlanilla.empleadoId}
                        field="diasTrabajados"
                        value={empleadoPlanilla.diasTrabajados}
                        type="number"
                        disabled={planillaLocal.estado !== 'borrador'}
                      />
                    </td>
                    
                    <td className="border-l">
                      <EditableCell
                        empleadoId={empleadoPlanilla.empleadoId}
                        field="horasExtra"
                        value={empleadoPlanilla.horasExtra}
                        type="number"
                        disabled={planillaLocal.estado !== 'borrador'}
                      />
                    </td>
                    
                    <td className="border-l">
                      <EditableCell
                        empleadoId={empleadoPlanilla.empleadoId}
                        field="salarioBase"
                        value={empleadoPlanilla.salarioBase}
                        disabled={true}
                      />
                    </td>
                    
                    <td className="border-l">
                      <div className="px-3 py-2 text-sm">
                        {formatearMoneda(
                          empleadoPlanilla.bonificaciones.reduce((sum, b) => sum + b.monto, 0)
                        )}
                      </div>
                    </td>
                    
                    <td className="border-l">
                      <div className="px-3 py-2 text-sm">
                        {formatearMoneda(empleadoPlanilla.totalDescuentos)}
                      </div>
                    </td>
                    
                    <td className="border-l">
                      <div className="px-3 py-2 text-sm font-medium text-green-600">
                        {formatearMoneda(empleadoPlanilla.salarioNeto)}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones */}
      {planillaLocal.estado === 'borrador' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Edición en Tiempo Real
                </h4>
                <p className="text-sm text-blue-700">
                  Haz clic en cualquier celda editable para modificar los valores. 
                  Los cálculos se actualizarán automáticamente. 
                  Presiona Enter para confirmar o Escape para cancelar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}