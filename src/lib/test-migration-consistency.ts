// ===============================================
// PRUEBAS DE MIGRACIÓN Y CONSISTENCIA DE DATOS
// ===============================================

import { supabase } from './supabase';
import { 
  migrarProductosAEstructuraCarpetas, 
  validarConsistenciaCarpetas,
} from './stock-flow';