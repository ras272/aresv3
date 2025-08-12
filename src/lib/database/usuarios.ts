import { supabase } from './shared/supabase'
import type { UsuariosModule } from './shared/types'

/**
 * ===============================================
 * 👥 MÓDULO DE USUARIOS
 * ===============================================
 * 
 * Este módulo está preparado para manejar operaciones relacionadas con usuarios.
 * Actualmente no hay funciones de gestión de usuarios en el sistema original,
 * pero este módulo proporciona la estructura para futuras implementaciones.
 * 
 * Las referencias a usuarios en el sistema actual son principalmente campos
 * como 'usuarioResponsable' y 'tecnicoResponsable' en movimientos de stock.
 */

/**
 * Obtiene información básica sobre usuarios responsables mencionados en el sistema
 * Esta función analiza los registros existentes para identificar usuarios únicos
 */
export async function getUsuariosReferenciados(): Promise<string[]> {
  try {
    console.log('👥 Obteniendo usuarios referenciados en el sistema...')

    // Obtener usuarios únicos de movimientos de stock
    const { data: movimientos, error: movimientosError } = await supabase
      .from('movimientos_stock')
      .select('usuario_responsable, tecnico_responsable')
      .not('usuario_responsable', 'is', null)

    if (movimientosError) throw movimientosError

    // Extraer usuarios únicos
    const usuarios = new Set<string>()
    
    movimientos?.forEach(mov => {
      if (mov.usuario_responsable && typeof mov.usuario_responsable === 'string') {
        usuarios.add(mov.usuario_responsable)
      }
      if (mov.tecnico_responsable && typeof mov.tecnico_responsable === 'string') {
        usuarios.add(mov.tecnico_responsable)
      }
    })

    const usuariosArray = Array.from(usuarios).filter(Boolean)
    
    console.log('✅ Usuarios referenciados encontrados:', usuariosArray.length)
    return usuariosArray

  } catch (error) {
    console.error('❌ Error obteniendo usuarios referenciados:', error)
    throw error
  }
}

/**
 * Obtiene estadísticas de actividad por usuario
 * Analiza los movimientos de stock para generar métricas por usuario
 */
export async function getEstadisticasUsuarios(): Promise<Array<{
  usuario: string
  totalMovimientos: number
  ultimaActividad: string
}>> {
  try {
    console.log('📊 Generando estadísticas de usuarios...')

    const { data: movimientos, error } = await supabase
      .from('movimientos_stock')
      .select('usuario_responsable, tecnico_responsable, created_at')
      .not('usuario_responsable', 'is', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Agrupar por usuario
    const estadisticas = new Map<string, { count: number, ultimaActividad: string }>()

    movimientos?.forEach(mov => {
      const usuarios = [mov.usuario_responsable, mov.tecnico_responsable]
        .filter(Boolean)
        .filter(usuario => typeof usuario === 'string')
      
      usuarios.forEach(usuario => {
        if (!estadisticas.has(usuario)) {
          estadisticas.set(usuario, { count: 0, ultimaActividad: mov.created_at })
        }
        
        const stats = estadisticas.get(usuario)!
        stats.count++
        
        // Actualizar última actividad si es más reciente
        if (new Date(mov.created_at) > new Date(stats.ultimaActividad)) {
          stats.ultimaActividad = mov.created_at
        }
      })
    })

    const resultado = Array.from(estadisticas.entries()).map(([usuario, stats]) => ({
      usuario,
      totalMovimientos: stats.count,
      ultimaActividad: stats.ultimaActividad
    }))

    console.log('✅ Estadísticas de usuarios generadas:', resultado.length)
    return resultado

  } catch (error) {
    console.error('❌ Error generando estadísticas de usuarios:', error)
    throw error
  }
}

// Implementación del módulo de usuarios
export const usuariosModule: UsuariosModule = {
  getUsuariosReferenciados,
  getEstadisticasUsuarios
}

// Exportaciones por defecto para compatibilidad
export default usuariosModule