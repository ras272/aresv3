// Configuración de Cloudinary para subida de archivos
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dsuwulc4f',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ares-documentos',
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

// Función para determinar el tipo de archivo
const getFileType = (file: File) => {
  const isPDF = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  
  return {
    isPDF,
    isImage,
    resourceType: isPDF ? 'raw' : (isImage ? 'image' : 'raw') // PDFs como 'raw' por defecto
  };
};

// Función para subir archivo a Cloudinary
export const uploadToCloudinary = async (
  file: File,
  codigoCarga: string,
  tipoDocumento: string
): Promise<{
  url: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  isPDF: boolean;
}> => {
  const formData = new FormData();
  const fileType = getFileType(file);

  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  const folder = `ares-docs/${codigoCarga}/${tipoDocumento.toLowerCase().replace(/\s+/g, '-')}`;
  formData.append('folder', folder);

  const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  formData.append('public_id', `${Date.now()}_${fileName}`);

  formData.append('resource_type', fileType.resourceType);

  try {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${fileType.resourceType}/upload`;

    console.log(`📤 Subiendo ${file.type} como ${fileType.resourceType} a:`, uploadUrl);
    console.log('FormData:', Object.fromEntries(formData));

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error subiendo archivo: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    console.log('✅ Archivo subido exitosamente:', data);

    return {
      url: data.url,
      publicId: data.public_id,
      secureUrl: data.secure_url,
      resourceType: fileType.resourceType,
      isPDF: fileType.isPDF,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Función para eliminar archivo de Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    console.log('Archivo marcado para eliminación:', publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Función para generar URL de transformación (redimensionar, optimizar)
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  } = {}
): string => {
  const { width = 400, height = 300, quality = 'auto', format = 'auto' } = options;

  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
};

// Enhanced logging utility for URL generation
const logUrlGeneration = (operation: string, publicId: string, options: any, generatedUrl: string) => {
  console.log(`🔗 [Cloudinary URL] ${operation}:`, {
    publicId,
    options,
    generatedUrl,
    timestamp: new Date().toISOString()
  });
};

// Core URL generation function - simplified and consolidated
export const getFileUrl = (
  publicId: string, 
  forDownload: boolean = false, 
  isPDF: boolean = false,
  options: { 
    page?: number; 
    resourceType?: string;
    width?: number;
    height?: number;
  } = {}
): string => {
  // Determine the correct resource type
  const resourceType = options.resourceType || (isPDF ? 'raw' : 'raw');
  
  // Base URL construction
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}`;
  
  let url: string;
  let operation: string;

  if (forDownload) {
    // Force download with attachment flag
    url = `${baseUrl}/${resourceType}/upload/fl_attachment/${publicId}`;
    operation = 'DOWNLOAD';
  } else if (isPDF && options.page) {
    // PDF page as image for preview
    const transformations = [
      'f_jpg',
      `pg_${options.page}`,
      options.width ? `w_${options.width}` : '',
      options.height ? `h_${options.height}` : '',
      'c_fit'
    ].filter(Boolean).join(',');
    
    url = `${baseUrl}/image/upload/${transformations}/${publicId}`;
    operation = 'PDF_PAGE_IMAGE';
  } else if (isPDF) {
    // Direct PDF view
    url = `${baseUrl}/${resourceType}/upload/${publicId}`;
    operation = 'PDF_VIEW';
  } else {
    // Regular file view
    url = `${baseUrl}/${resourceType}/upload/${publicId}`;
    operation = 'FILE_VIEW';
  }

  // Log the URL generation attempt
  logUrlGeneration(operation, publicId, { forDownload, isPDF, ...options }, url);

  return url;
};

// Simplified download URL function
export const getDownloadUrl = (publicId: string, isPDF: boolean = false): string => {
  return getFileUrl(publicId, true, isPDF);
};

// Simplified PDF page view function
export const getPDFViewUrl = (publicId: string, page: number = 1): string => {
  return getFileUrl(publicId, false, true, { page });
};

// Simplified PDF full view function  
export const getPDFFullViewUrl = (publicId: string): string => {
  return getFileUrl(publicId, false, true);
};

// Función para obtener múltiples páginas de un PDF
export const getPDFPages = (publicId: string, totalPages: number): string[] => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(getPDFViewUrl(publicId, i));
  }
  return pages;
};

// Función para generar URL de thumbnail de PDF
export const getPDFThumbnail = (publicId: string, width: number = 200, height: number = 300): string => {
  return getFileUrl(publicId, false, true, { page: 1, width, height });
};