'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/database/shared/supabase';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
  className?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  className = '',
  maxSizeMB = 5
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`El archivo es muy grande. Máximo ${maxSizeMB}MB permitido`);
      return;
    }

    setIsUploading(true);

    try {
      // Crear preview local
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `stock-images/${fileName}`;

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Limpiar preview local
      URL.revokeObjectURL(localPreviewUrl);
      
      // Actualizar con URL real
      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      
      toast.success('Imagen subida exitosamente');

    } catch (error) {
      console.error('Error subiendo imagen:', error);
      toast.error('Error al subir la imagen. Inténtalo de nuevo.');
      
      // Limpiar preview en caso de error
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!previewUrl) return;

    try {
      // Si es una URL de Supabase, intentar eliminar el archivo
      if (previewUrl.includes('supabase.co') && previewUrl.includes('stock-images/')) {
        const urlParts = previewUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `stock-images/${fileName}`;

        await supabase.storage
          .from('images')
          .remove([filePath]);
      }

      setPreviewUrl(null);
      onImageRemoved();
      toast.success('Imagen eliminada');

    } catch (error) {
      console.error('Error eliminando imagen:', error);
      // Aún así removemos la referencia local
      setPreviewUrl(null);
      onImageRemoved();
      toast.success('Imagen eliminada');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <Card className="relative">
          <CardContent className="p-4">
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              
              {/* Overlay con botones */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={triggerFileSelect}
                  disabled={isUploading}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="ml-2">Cambiar</span>
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                  <span className="ml-2">Eliminar</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="p-8">
            <div 
              className="text-center cursor-pointer"
              onClick={triggerFileSelect}
            >
              <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                {isUploading ? (
                  <Loader2 className="w-full h-full animate-spin" />
                ) : (
                  <ImageIcon className="w-full h-full" />
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {isUploading ? 'Subiendo imagen...' : 'Agregar imagen del producto'}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF hasta {maxSizeMB}MB
                </p>
              </div>
              
              <Button
                variant="outline"
                className="mt-4"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar archivo
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}