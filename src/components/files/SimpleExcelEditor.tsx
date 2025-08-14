'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archivo } from '@/types/files';
import { 
  Save, 
  Download, 
  X, 
  Clock, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
// import { downloadFileSimple } from '@/lib/supabase-simple'; // TODO: Implementar función de descarga

interface SimpleExcelEditorProps {
  archivo: Archivo;
  onClose: () => void;
  onSave?: (data: any) => void;
}

function SimpleExcelEditor({ archivo, onClose, onSave }: SimpleExcelEditorProps) {
  const [data, setData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    loadExcelFile();
  }, [archivo]);

  const loadExcelFile = async () => {
    try {
      setLoading(true);
      setError(null);

      let fileData: ArrayBuffer;
      
      if (archivo.url_publica) {
        const response = await fetch(archivo.url_publica);
        if (!response.ok) throw new Error('No se pudo descargar el archivo');
        fileData = await response.arrayBuffer();
      } else if (archivo.ruta_storage) {
        // TODO: Implementar descarga desde Supabase Storage
        throw new Error('Descarga desde storage no implementada aún');
      } else {
        throw new Error('No se encontró la ruta del archivo');
      }

      const workbook = XLSX.read(fileData, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        const firstRow = jsonData[0] as any[];
        const hasHeaders = firstRow.some(cell => typeof cell === 'string' && isNaN(Number(cell)));
        
        if (hasHeaders) {
          setHeaders(firstRow.map(cell => String(cell || '')));
          setData(jsonData.slice(1));
        } else {
          const autoHeaders = firstRow.map((_, index) => 
            String.fromCharCode(65 + index)
          );
          setHeaders(autoHeaders);
          setData(jsonData);
        }
      } else {
        setHeaders(['A', 'B', 'C', 'D', 'E']);
        setData([['', '', '', '', '']]);
      }

      toast.success(`Archivo ${archivo.nombre} cargado exitosamente`);

    } catch (err) {
      console.error('Error loading Excel file:', err);
      setError('Error al cargar el archivo Excel');
      setHeaders(['Columna A', 'Columna B', 'Columna C']);
      setData([
        ['Error al cargar archivo', 'Datos no disponibles', ''],
        ['Puedes editar estas celdas', '', ''],
        ['', '', '']
      ]);
      toast.error(`Error al cargar ${archivo.nombre}: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    if (!newData[rowIndex]) {
      newData[rowIndex] = [];
    }
    newData[rowIndex][colIndex] = value;
    setData(newData);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const dataWithHeaders = [headers, ...data];
      
      if (onSave) {
        onSave({
          data: dataWithHeaders,
          headers,
          rows: data.length,
          cols: headers.length
        });
      }
      
      setLastSaved(new Date());
      setHasChanges(false);
      toast.success('Planilla guardada exitosamente');
      
    } catch (error) {
      toast.error('Error al guardar la planilla');
      console.error('Save error:', error);
    }
  };

  const handleDownload = () => {
    try {
      const dataWithHeaders = [headers, ...data];
      const ws = XLSX.utils.aoa_to_sheet(dataWithHeaders);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Hoja1');
      XLSX.writeFile(wb, archivo.nombre.replace(/\.[^/.]+$/, '') + '_editado.xlsx');
      
      toast.success('Archivo descargado exitosamente');
    } catch (error) {
      toast.error('Error al descargar el archivo');
      console.error('Download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cargando Editor Excel
          </h3>
          <p className="text-gray-500">
            Preparando editor para {archivo.nombre}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{archivo.nombre}</h2>
              <div className="flex items-center gap-4 mt-1">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Editor Simple
                </Badge>
                <span className="text-sm text-gray-500">
                  {data.length} filas × {headers.length} columnas
                </span>
                {lastSaved && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    Guardado {lastSaved.toLocaleTimeString()}
                  </div>
                )}
                {hasChanges && (
                  <div className="flex items-center gap-1 text-sm text-orange-600">
                    <AlertCircle className="w-3 h-3" />
                    Cambios sin guardar
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-12 h-10 border border-gray-200 bg-gray-100 text-xs text-gray-500"></th>
                {headers.map((header, index) => (
                  <th key={index} className="min-w-32 h-10 border border-gray-200 bg-gray-100 text-xs text-gray-700 font-medium px-2">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="w-12 h-10 border border-gray-200 bg-gray-50 text-xs text-gray-500 text-center font-medium">
                    {rowIndex + 1}
                  </td>
                  {headers.map((_, colIndex) => (
                    <td key={colIndex} className="min-w-32 h-10 border border-gray-200">
                      <input
                        type="text"
                        value={row[colIndex] || ''}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className="w-full h-full px-2 text-sm bg-transparent border-0 outline-0 focus:bg-blue-50"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t px-6 py-3 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div>
            Editor Simple de Excel
          </div>
          <div>
            Tamaño: {(archivo.tamaño / 1024).toFixed(1)} KB
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            Última modificación: {archivo.updated_at.toLocaleDateString()}
          </div>
          <div>
            Sistema de Archivos ARES
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimpleExcelEditor;