import { supabase } from './supabase';

export interface DocumentoCarga {
  cargaId: string;
  codigoCarga: string;
  nombre: string;
  tipoDocumento: string;
  archivo: {
    nombre: string;
    tamaño: number;
    tipo: string;
    url: string;
  };
  observaciones?: string;
  fechaSubida: string;
  subidoPor: string;
}

export async function createDocumentoCarga(documento: DocumentoCarga) {
  try {
    console.log('📄 Creando documento en la base de datos:', documento);

    const { data, error } = await supabase
      .from('documentos_carga')
      .insert({
        carga_id: documento.cargaId,
        codigo_carga: documento.codigoCarga,
        nombre: documento.nombre,
        tipo_documento: documento.tipoDocumento,
        archivo_nombre: documento.archivo.nombre,
        archivo_tamaño: documento.archivo.tamaño,
        archivo_tipo: documento.archivo.tipo,
        archivo_url: documento.archivo.url,
        observaciones: documento.observaciones,
        fecha_subida: documento.fechaSubida,
        subido_por: documento.subidoPor
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando documento:', error);
      throw error;
    }

    console.log('✅ Documento creado exitosamente:', data);
    return data;

  } catch (error) {
    console.error('❌ Error en createDocumentoCarga:', error);
    throw error;
  }
}

export async function getAllDocumentosCarga() {
  try {
    const { data, error } = await supabase
      .from('documentos_carga')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo documentos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getAllDocumentosCarga:', error);
    throw error;
  }
}

export async function deleteDocumentoCarga(documentoId: string) {
  try {
    const { error } = await supabase
      .from('documentos_carga')
      .delete()
      .eq('id', documentoId);

    if (error) {
      console.error('❌ Error eliminando documento:', error);
      throw error;
    }

    console.log('✅ Documento eliminado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en deleteDocumentoCarga:', error);
    throw error;
  }
}