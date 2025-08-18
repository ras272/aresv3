# 🔢 Sistema de Numeración Unificado - ARES

## 📋 Descripción

El Sistema de Numeración Unificado centraliza la generación de números únicos para todos los documentos del sistema ARES, garantizando consistencia, trazabilidad y evitando duplicados.

## 🎯 Objetivos

- ✅ **Unificar** toda la numeración en un solo servicio
- ✅ **Estandarizar** formatos de números en todo el sistema
- ✅ **Eliminar** duplicados y conflictos de numeración
- ✅ **Facilitar** el mantenimiento y debugging
- ✅ **Mejorar** la trazabilidad de documentos

## 📊 Tipos de Documentos Soportados

| Tipo | Prefijo | Formato | Ejemplo | Descripción |
|------|---------|---------|---------|-------------|
| **Reportes** | `RPT` | `RPT-YYYYMMDD-XXX` | `RPT-20250115-001` | Reportes técnicos de mantenimiento |
| **Tickets** | `TK` | `TK-YYYYMMDD-XXX` | `TK-20250115-001` | Tickets de ServTec |
| **Formularios** | `FORM` | `FORM-YYYYMMDD-XXX` | `FORM-20250115-001` | Formularios de asistencia técnica |
| **Facturas** | `FACT` | `FACT-YYYYMMDD-XXXX` | `FACT-20250115-0001` | Facturas de servicios |
| **Remisiones** | `REM` | `REM-YYYYMMDD-XXXX` | `REM-20250115-0001` | Remisiones de entrega |
| **Órdenes de Trabajo** | `OT` | `OT-YYYYMMDD-XXX` | `OT-20250115-001` | Órdenes de trabajo técnico |

## 🚀 Uso del Servicio

### Importación

```typescript
import { NumberingService } from '@/lib/services/numbering-service';
import { useNumbering } from '@/hooks/useNumbering';
```

### Generar Números

```typescript
// Método directo
const numeroReporte = await NumberingService.generateReportNumber();
// Resultado: "RPT-20250115-001"

const numeroTicket = await NumberingService.generateTicketNumber();
// Resultado: "TK-20250115-001"

// Método genérico
const numeroFactura = await NumberingService.generateNumber('factura');
// Resultado: "FACT-20250115-0001"

// Con fecha específica
const fecha = new Date('2025-01-20');
const numeroFormulario = await NumberingService.generateNumber('formulario', fecha);
// Resultado: "FORM-20250120-001"
```

### Usar en Componentes React

```typescript
function CrearReporte() {
  const { generateReportNumber, isGenerating, error } = useNumbering();
  
  const handleCrearReporte = async () => {
    try {
      const numero = await generateReportNumber();
      console.log('Número generado:', numero);
    } catch (err) {
      console.error('Error:', error);
    }
  };
  
  return (
    <Button onClick={handleCrearReporte} disabled={isGenerating}>
      {isGenerating ? 'Generando...' : 'Crear Reporte'}
    </Button>
  );
}
```

### Validar Números

```typescript
// Validar formato
const esValido = NumberingService.validateNumber('RPT-20250115-001', 'reporte');
// Resultado: true

// Parsear número
const info = NumberingService.parseNumber('RPT-20250115-001');
// Resultado: { prefix: 'RPT', date: '20250115', sequential: 1, isValid: true }
```

### Obtener Estadísticas

```typescript
const stats = await NumberingService.getNumberingStats('reporte');
// Resultado: { totalToday: 5, totalThisMonth: 127, lastNumber: 'RPT-20250115-005' }
```

### Reservar Rango de Números

```typescript
// Para operaciones masivas
const numeros = await NumberingService.reserveNumberRange('ticket', 10);
// Resultado: ['TK-20250115-001', 'TK-20250115-002', ..., 'TK-20250115-010']
```

## 🔧 Migración desde Sistema Anterior

### Funciones Deprecadas (Mantienen Compatibilidad)

```typescript
// ❌ Antiguo (deprecado pero funcional)
import { generateNumeroReporte } from '@/lib/database/mantenimientos';
const numero = await generateNumeroReporte();

// ✅ Nuevo (recomendado)
import { NumberingService } from '@/lib/services/numbering-service';
const numero = await NumberingService.generateReportNumber();
```

### Actualización Gradual

1. **Fase 1**: Instalar nuevo servicio (✅ Completado)
2. **Fase 2**: Usar en nuevos desarrollos
3. **Fase 3**: Migrar código existente gradualmente
4. **Fase 4**: Remover funciones deprecadas

## 🗄️ Base de Datos

### Nuevas Tablas

```sql
-- Facturas
CREATE TABLE facturas (
    id UUID PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    mantenimiento_id UUID REFERENCES mantenimientos(id),
    -- ... otros campos
);

-- Remisiones  
CREATE TABLE remisiones (
    id UUID PRIMARY KEY,
    numero_remision VARCHAR(50) UNIQUE NOT NULL,
    mantenimiento_id UUID REFERENCES mantenimientos(id),
    -- ... otros campos
);
```

### Nuevas Columnas

```sql
-- En tabla mantenimientos
ALTER TABLE mantenimientos 
ADD COLUMN numero_formulario VARCHAR(50),
ADD COLUMN numero_orden_trabajo VARCHAR(50);
```

### Constraints de Validación

```sql
-- Validar formatos automáticamente
ALTER TABLE mantenimientos 
ADD CONSTRAINT chk_numero_reporte_format 
CHECK (numero_reporte IS NULL OR validate_number_format(numero_reporte, 'RPT'));
```

## 📊 Dashboard de Administración

### Componente de Administración

```typescript
import { NumberingDashboard } from '@/components/admin/NumberingDashboard';

function AdminPage() {
  return (
    <div>
      <h1>Administración</h1>
      <NumberingDashboard />
    </div>
  );
}
```

### Características del Dashboard

- 📈 **Estadísticas en tiempo real** por tipo de documento
- 🔢 **Generador manual** de números para testing
- ✅ **Validador** de formatos de números
- 📋 **Vista de últimos números** generados
- 🔄 **Actualización automática** de estadísticas

## 🧪 Testing

### Ejecutar Tests

```bash
npm test src/lib/services/__tests__/numbering-service.test.ts
```

### Casos de Prueba Cubiertos

- ✅ Generación de números con formato correcto
- ✅ Incremento secuencial automático
- ✅ Manejo de errores con fallback
- ✅ Validación de formatos
- ✅ Parseo de números existentes
- ✅ Estadísticas de numeración
- ✅ Reserva de rangos de números
- ✅ Compatibilidad con funciones deprecadas

## 🔍 Debugging y Monitoreo

### Logs del Sistema

```typescript
// El servicio incluye logging automático
console.log('🔢 Generando número REPORTE: RPT-20250115-XXX');
console.log('✅ Número reporte generado: RPT-20250115-001');
```

### Verificar Consistencia

```typescript
// Verificar que no hay duplicados
const stats = await NumberingService.getNumberingStats('reporte');
console.log('Total hoy:', stats.totalToday);
console.log('Último número:', stats.lastNumber);
```

## 🚨 Manejo de Errores

### Fallback Automático

```typescript
// En caso de error de BD, se genera número de fallback
// Formato: PREFIX-FALLBACK-XXXXXX
// Ejemplo: "RPT-FALLBACK-123456"
```

### Validación de Entrada

```typescript
// El servicio valida automáticamente los tipos
try {
  const numero = await NumberingService.generateNumber('tipo_invalido');
} catch (error) {
  console.error('Tipo de documento no soportado');
}
```

## 📈 Beneficios del Sistema Unificado

### Antes (Sistema Fragmentado)

```typescript
// ❌ Múltiples implementaciones
const reporteNum = WordReporteService.generarNumeroReporte(equipo, fecha);
const ticketNum = obtenerProximoNumeroTicket();
const formNum = WordReporteService.generarNumeroFormulario();

// ❌ Formatos inconsistentes
// "1234 Equipo ABC" vs "TK-001" vs "123"
```

### Después (Sistema Unificado)

```typescript
// ✅ Una sola implementación
const reporteNum = await NumberingService.generateReportNumber();
const ticketNum = await NumberingService.generateTicketNumber();
const formNum = await NumberingService.generateFormNumber();

// ✅ Formatos consistentes
// "RPT-20250115-001" vs "TK-20250115-001" vs "FORM-20250115-001"
```

### Ventajas Clave

1. **Consistencia**: Todos los números siguen el mismo patrón
2. **Trazabilidad**: Fácil identificar fecha y tipo de documento
3. **Escalabilidad**: Soporte para nuevos tipos de documentos
4. **Mantenibilidad**: Un solo lugar para cambios de numeración
5. **Testing**: Cobertura completa de pruebas
6. **Monitoreo**: Dashboard de administración integrado

## 🔄 Roadmap Futuro

### Próximas Mejoras

- [ ] **Numeración por sucursal** (RPT-ASU-20250115-001)
- [ ] **Integración con códigos QR** automáticos
- [ ] **API REST** para sistemas externos
- [ ] **Backup y restauración** de secuencias
- [ ] **Auditoría completa** de cambios de numeración

### Extensibilidad

```typescript
// Fácil agregar nuevos tipos de documentos
const DOCUMENT_CONFIG = {
  // ... tipos existentes
  cotizacion: {
    prefix: 'COT',
    digits: 4,
    table: 'cotizaciones',
    column: 'numero_cotizacion'
  }
};
```

---

## 📞 Soporte

Para dudas o problemas con el sistema de numeración:

1. **Revisar logs** del servicio
2. **Verificar migración** de base de datos
3. **Consultar tests** para ejemplos de uso
4. **Usar dashboard** de administración para debugging

**¡El sistema está listo para usar! 🚀**