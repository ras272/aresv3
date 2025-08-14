// ===============================================
// PRUEBAS DE MIGRACIÓN Y CONSISTENCIA DE DATOS
// ===============================================

import { supabase } from './database/shared/supabase';
import { 
  migrarProductosAEstructuraCarpetas, 
  validarConsistenciaCarpetas,
} from './stock-flow';