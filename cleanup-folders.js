// Script temporal para eliminar carpetas incorrectas del sistema de archivos
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function eliminarCarpetasIncorrectas() {
  try {
    console.log('🔄 Eliminando carpetas incorrectas del sistema de archivos...');
    
    // Buscar carpetas Classys y Venus
    const { data: carpetas, error: buscarError } = await supabase
      .from('carpetas')
      .select('*')
      .in('nombre', ['Classys', 'Venus', 'ClassysY']);
    
    if (buscarError) {
      console.error('❌ Error buscando carpetas:', buscarError);
      return;
    }
    
    if (!carpetas || carpetas.length === 0) {
      console.log('✅ No se encontraron carpetas para eliminar');
      return;
    }
    
    console.log(`📁 Encontradas ${carpetas.length} carpetas para eliminar:`, carpetas.map(c => c.nombre));
    
    // Eliminar archivos de estas carpetas primero
    for (const carpeta of carpetas) {
      const { data: archivos, error: archivosError } = await supabase
        .from('archivos')
        .select('id, nombre')
        .eq('carpeta_id', carpeta.id);
      
      if (archivosError) {
        console.error(`❌ Error buscando archivos en carpeta ${carpeta.nombre}:`, archivosError);
        continue;
      }
      
      if (archivos && archivos.length > 0) {
        console.log(`📄 Eliminando ${archivos.length} archivos de carpeta ${carpeta.nombre}...`);
        
        const { error: eliminarArchivosError } = await supabase
          .from('archivos')
          .delete()
          .eq('carpeta_id', carpeta.id);
        
        if (eliminarArchivosError) {
          console.error(`❌ Error eliminando archivos de ${carpeta.nombre}:`, eliminarArchivosError);
          continue;
        }
        
        console.log(`✅ Archivos eliminados de ${carpeta.nombre}`);
      }
    }
    
    // Eliminar las carpetas
    const { error: eliminarError } = await supabase
      .from('carpetas')
      .delete()
      .in('nombre', ['Classys', 'Venus', 'ClassysY']);
    
    if (eliminarError) {
      console.error('❌ Error eliminando carpetas:', eliminarError);
      return;
    }
    
    console.log('✅ Carpetas eliminadas exitosamente');
    console.log('🎉 Limpieza completada');
    
  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  }
}

// Ejecutar la limpieza
eliminarCarpetasIncorrectas();