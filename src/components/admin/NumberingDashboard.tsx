// 📊 Dashboard de Numeración - Administración del sistema de numeración unificado
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNumbering } from '@/hooks/useNumbering';
import { DocumentType } from '@/lib/services/numbering-service';
import { 
  FileText, 
  Ticket, 
  FileCheck, 
  Receipt, 
  Package, 
  Wrench,
  TrendingUp,
  Calendar,
  Hash,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

const DOCUMENT_TYPES: { type: DocumentType; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { type: 'reporte', label: 'Reportes Técnicos', icon: FileText, color: 'text-blue-600' },
  { type: 'ticket', label: 'Tickets ServTec', icon: Ticket, color: 'text-green-600' },
  { type: 'formulario', label: 'Formularios', icon: FileCheck, color: 'text-purple-600' },
  { type: 'factura', label: 'Facturas', icon: Receipt, color: 'text-orange-600' },
  { type: 'remision', label: 'Remisiones', icon: Package, color: 'text-red-600' },
  { type: 'orden_trabajo', label: 'Órdenes de Trabajo', icon: Wrench, color: 'text-indigo-600' }
];

interface NumberingStats {
  totalToday: number;
  totalThisMonth: number;
  lastNumber: string | null;
}

export function NumberingDashboard() {
  const { generateNumber, validateNumber, parseNumber, getStats, isGenerating } = useNumbering();
  
  const [stats, setStats] = useState<Record<DocumentType, NumberingStats>>({} as any);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<DocumentType>('reporte');
  const [testNumber, setTestNumber] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [generatedNumber, setGeneratedNumber] = useState('');

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const allStats: Record<DocumentType, NumberingStats> = {} as any;
      
      for (const docType of DOCUMENT_TYPES) {
        try {
          const docStats = await getStats(docType.type);
          allStats[docType.type] = docStats;
        } catch (error) {
          console.error(`Error cargando stats para ${docType.type}:`, error);
          allStats[docType.type] = {
            totalToday: 0,
            totalThisMonth: 0,
            lastNumber: null
          };
        }
      }
      
      setStats(allStats);
    } catch (error) {
      toast.error('Error cargando estadísticas de numeración');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNumber = async () => {
    try {
      const number = await generateNumber(selectedType);
      setGeneratedNumber(number);
      toast.success(`Número ${selectedType} generado: ${number}`);
      
      // Recargar estadísticas
      await loadAllStats();
    } catch (error) {
      toast.error('Error generando número');
    }
  };

  const handleValidateNumber = () => {
    if (!testNumber.trim()) {
      setValidationResult(null);
      return;
    }

    const isValid = validateNumber(testNumber, selectedType);
    const parsed = parseNumber(testNumber);
    
    setValidationResult({
      isValid,
      parsed,
      expectedFormat: getExpectedFormat(selectedType)
    });
  };

  const getExpectedFormat = (type: DocumentType): string => {
    const prefixes = {
      reporte: 'RPT',
      ticket: 'TK',
      formulario: 'FORM',
      factura: 'FACT',
      remision: 'REM',
      orden_trabajo: 'OT'
    };
    
    return `${prefixes[type]}-YYYYMMDD-XXX`;
  };

  const formatDate = (dateStr: string): string => {
    if (dateStr.length !== 8) return dateStr;
    
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Numeración</h2>
          <p className="text-gray-600">Administración centralizada de numeración de documentos</p>
        </div>
        <Button onClick={loadAllStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas por Tipo de Documento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const IconComponent = docType.icon;
          const docStats = stats[docType.type] || { totalToday: 0, totalThisMonth: 0, lastNumber: null };
          
          return (
            <Card key={docType.type}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <IconComponent className={`h-4 w-4 ${docType.color}`} />
                  <span>{docType.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hoy:</span>
                  <Badge variant="outline">{docStats.totalToday}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Este mes:</span>
                  <Badge variant="secondary">{docStats.totalThisMonth}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-xs text-gray-500">Último número:</span>
                  <p className="text-xs font-mono mt-1 p-2 bg-gray-50 rounded">
                    {docStats.lastNumber || 'Ninguno'}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Herramientas de Administración */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Generador de Números */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Hash className="h-5 w-5" />
              <span>Generar Número</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="docType">Tipo de Documento</Label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as DocumentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((docType) => {
                    const IconComponent = docType.icon;
                    return (
                      <SelectItem key={docType.type} value={docType.type}>
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`h-4 w-4 ${docType.color}`} />
                          <span>{docType.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerateNumber} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Hash className="h-4 w-4 mr-2" />
                  Generar Número
                </>
              )}
            </Button>

            {generatedNumber && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Número generado:</span>
                </div>
                <p className="font-mono text-lg mt-1 text-green-900">{generatedNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validador de Números */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Validar Número</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testNumber">Número a Validar</Label>
              <Input
                id="testNumber"
                value={testNumber}
                onChange={(e) => {
                  setTestNumber(e.target.value);
                  handleValidateNumber();
                }}
                placeholder="Ej: RPT-20250115-001"
                className="font-mono"
              />
            </div>

            <div className="text-xs text-gray-500">
              Formato esperado para {selectedType}: <code>{getExpectedFormat(selectedType)}</code>
            </div>

            {validationResult && (
              <div className={`p-3 border rounded-lg ${
                validationResult.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    validationResult.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {validationResult.isValid ? 'Número válido' : 'Número inválido'}
                  </span>
                </div>

                {validationResult.parsed && (
                  <div className="space-y-1 text-xs">
                    <div><strong>Prefijo:</strong> {validationResult.parsed.prefix}</div>
                    <div><strong>Fecha:</strong> {formatDate(validationResult.parsed.date)}</div>
                    <div><strong>Secuencial:</strong> {validationResult.parsed.sequential}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Información del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Formatos de Numeración:</h4>
              <ul className="space-y-1 text-gray-600">
                <li><code>RPT-YYYYMMDD-XXX</code> - Reportes Técnicos</li>
                <li><code>TK-YYYYMMDD-XXX</code> - Tickets ServTec</li>
                <li><code>FORM-YYYYMMDD-XXX</code> - Formularios</li>
                <li><code>FACT-YYYYMMDD-XXXX</code> - Facturas</li>
                <li><code>REM-YYYYMMDD-XXXX</code> - Remisiones</li>
                <li><code>OT-YYYYMMDD-XXX</code> - Órdenes de Trabajo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Características:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Numeración secuencial por día</li>
                <li>• Formato unificado en todo el sistema</li>
                <li>• Fallback automático en caso de error</li>
                <li>• Validación de formato integrada</li>
                <li>• Estadísticas en tiempo real</li>
                <li>• Compatibilidad con código existente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}