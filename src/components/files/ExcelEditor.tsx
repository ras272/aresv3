'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archivo } from '@/types/files';
import { 
  Save, 
  Download, 
  X, 
  Clock, 
  Users, 
  AlertCircle,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
// import { downloadFileSimple } from '@/lib/supabase-simple'; // TODO: Implementar función de descarga

// Registrar todos los módulos de Handsontable
registerAllModules();

interface ExcelEditorProps {
  archivo: Archivo;
  onClose: () => void;
  onSave?: (data: any) => void;
}

function ExcelEditor({ archivo, onClose, onSave }: ExcelEditorProps) {
  const [data, setData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const hotTableRef = useRef<any>(null);

  const [collaborators] = useState([
    { id: '1', name: 'Juan González', color: '#3B82F6', active: true },
    { id: '2', name: 'María Rodríguez', color: '#10B981', active: false }
  ]);

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

  const handleAfterChange = (changes: any) => {
    if (changes) {
      setHasChanges(true);
      setTimeout(() => {
        if (hasChanges) {
          handleAutoSave();
        }
      }, 2000);
    }
  };

  const handleSave = async () => {
    if (!hotTableRef.current) return;
    
    setIsSaving(true);
    try {
      const hotInstance = hotTableRef.current.hotInstance;
      const currentData = hotInstance.getData();
      const dataWithHeaders = [headers, ...currentData];
      
      if (onSave) {
        onSave({
          data: dataWithHeaders,
          headers,
          rows: currentData.length,
          cols: headers.length
        });
      }
      
      setLastSaved(new Date());
      setHasChanges(false);
      toast.success('Planilla guardada exitosamente');
      
    } catch (error) {
      toast.error('Error al guardar la planilla');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSave = async () => {
    if (!hasChanges || isSaving || !hotTableRef.current) return;
    
    try {
      const hotInstance = hotTableRef.current.hotInstance;
      const currentData = hotInstance.getData();
      const dataWithHeaders = [headers, ...currentData];
      
      if (onSave) {
        onSave({
          data: dataWithHeaders,
          headers,
          rows: currentData.length,
          cols: headers.length,
          autoSave: true
        });
      }
      
      setLastSaved(new Date());
      setHasChanges(false);
      
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleDownload = () => {
    if (!hotTableRef.current) return;
    
    try {
      const hotInstance = hotTableRef.current.hotInstance;
      const currentData = hotInstance.getData();
      const dataWithHeaders = [headers, ...currentData];
      
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

  const addRow = () => {
    if (hotTableRef.current) {
      const hotInstance = hotTableRef.current.hotInstance;
      hotInstance.alter('insert_row_below', hotInstance.countRows());
      setHasChanges(true);
    }
  };

  const addColumn = () => {
    if (hotTableRef.current) {
      const hotInstance = hotTableRef.current.hotInstance;
      hotInstance.alter('insert_col_right', hotInstance.countCols());
      const newHeaders = [...headers, `Col ${headers.length + 1}`];
      setHeaders(newHeaders);
      setHasChanges(true);
    }
  };

  const resetData = () => {
    if (confirm('¿Estás seguro de que quieres recargar los datos originales? Se perderán todos los cambios no guardados.')) {
      loadExcelFile();
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
            Preparando Handsontable para {archivo.nombre}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-white z-50 flex flex-col ${isFullscreen ? '' : 'p-4'}`}>
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{archivo.nombre}</h2>
              <div className="flex items-center gap-4 mt-1">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Handsontable Pro
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
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div className="flex -space-x-2">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white ${
                    collab.active ? 'ring-2 ring-green-400' : ''
                  }`}
                  style={{ backgroundColor: collab.color }}
                  title={`${collab.name} ${collab.active ? '(En línea)' : '(Desconectado)'}`}
                >
                  {collab.name.split(' ').map(n => n[0]).join('')}
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetData}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Recargar
          </Button>

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
            disabled={isSaving || !hasChanges}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </>
            )}
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

      <div className="bg-gray-50 border-b px-6 py-3 flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={addRow}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Fila
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={addColumn}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Columna
        </Button>
        <div className="ml-auto text-sm text-gray-600">
          <span className="font-medium">Funciones:</span> Click derecho para menú contextual • Ctrl+Z/Y para deshacer/rehacer • Filtros y ordenamiento disponibles
        </div>
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full border rounded-lg overflow-hidden bg-white shadow-sm">
          <HotTable
            ref={hotTableRef}
            data={data}
            colHeaders={headers}
            rowHeaders={true}
            width="100%"
            height="100%"
            licenseKey="non-commercial-and-evaluation"
            stretchH="all"
            contextMenu={true}
            manualColumnResize={true}
            manualRowResize={true}
            manualColumnMove={true}
            manualRowMove={true}
            copyPaste={true}
            fillHandle={true}
            undoRedo={true}
            afterChange={handleAfterChange}
            settings={{
              dropdownMenu: true,
              filters: true,
              columnSorting: true,
              autoWrapRow: true,
              autoWrapCol: true,
              enterBeginsEditing: false,
              outsideClickDeselects: false,
              selectionMode: 'multiple',
              mergeCells: true,
              comments: true,
              customBorders: true,
              search: true,
              wordWrap: true,
              className: 'handsontable-excel-editor'
            }}
          />
        </div>
      </div>

      <div className="bg-gray-50 border-t px-6 py-3 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div>
            Powered by Handsontable
          </div>
          <div>
            Tamaño: {(archivo.tamaño / 1024).toFixed(1)} KB
          </div>
          <div>
            Auto-guardado activado
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

export default ExcelEditor;