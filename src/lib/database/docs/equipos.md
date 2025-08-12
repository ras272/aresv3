# Equipos Module Documentation

## Overview

The Equipos module handles equipment management and component operations. It manages the complete lifecycle of medical equipment, from creation and component assignment to maintenance tracking and history management.

## Interface

```typescript
export interface EquiposModule extends DatabaseModule {
  createEquipo(equipoData: EquipoInput): Promise<Equipo>
  createEquipoFromMercaderia(producto: any, carga: any, subitems?: any[]): Promise<Equipo>
  getAllEquipos(): Promise<Equipo[]>
  deleteEquipo(equipoId: string): Promise<void>
  getAllComponentesDisponibles(): Promise<ComponenteDisponible[]>
  asignarComponenteAEquipo(componenteId: string, equipoId: string): Promise<void>
  getHistorialAsignaciones(equipoId: string): Promise<AsignacionComponente[]>
  updateComponente(componenteId: string, updates: any): Promise<boolean>
  createComponenteInventarioTecnico(componenteData: any): Promise<any>
  createComponenteInventarioTecnicoReparacion(componenteData: any): Promise<any>
  createComponenteInventarioTecnicoFromSubitem(subitem: any, carga: any): Promise<any>
}
```

## Functions

### `createEquipo(equipoData: EquipoInput): Promise<Equipo>`

Creates a new equipment record with its components.

**Parameters:**
- `equipoData`: Equipment data including client, location, and components

**Returns:** Promise resolving to the created Equipo

**Example:**
```typescript
import { createEquipo } from '@/lib/database/equipos'

const equipoData = {
  cliente: 'Hospital Central',
  ubicacion: 'UCI - Sala 3',
  nombreEquipo: 'Monitor de Signos Vitales',
  tipoEquipo: 'Monitoreo',
  marca: 'Philips',
  modelo: 'IntelliVue MX40',
  numeroSerieBase: 'PH123456789',
  componentes: [
    {
      nombre: 'Cable ECG 5 derivaciones',
      numeroSerie: 'ECG001',
      estado: 'Operativo',
      observaciones: 'Cable principal'
    },
    {
      nombre: 'Sensor SpO2',
      numeroSerie: 'SPO2001',
      estado: 'Operativo'
    }
  ],
  fechaEntrega: '2024-01-15',
  observaciones: 'Equipo nuevo, instalación completa'
}

try {
  const equipo = await createEquipo(equipoData)
  console.log('Equipment created:', equipo.id)
  console.log('Components:', equipo.componentes.length)
} catch (error) {
  console.error('Error creating equipment:', error)
}
```

### `getAllEquipos(): Promise<Equipo[]>`

Retrieves all equipment in the system with their components.

**Returns:** Promise resolving to array of all equipment

**Example:**
```typescript
import { getAllEquipos } from '@/lib/database/equipos'

try {
  const equipos = await getAllEquipos()
  console.log(`Found ${equipos.length} equipment`)
  
  // Group by client
  const byClient = equipos.reduce((acc, equipo) => {
    acc[equipo.cliente] = (acc[equipo.cliente] || 0) + 1
    return acc
  }, {})
  
  console.log('Equipment by client:', byClient)
} catch (error) {
  console.error('Error fetching equipment:', error)
}
```

### `getAllComponentesDisponibles(): Promise<ComponenteDisponible[]>`

Retrieves all available components that can be assigned to equipment.

**Returns:** Promise resolving to array of available components

**Example:**
```typescript
import { getAllComponentesDisponibles } from '@/lib/database/equipos'

try {
  const componentes = await getAllComponentesDisponibles()
  console.log(`Available components: ${componentes.length}`)
  
  // Filter by type
  const cables = componentes.filter(c => c.tipoComponente === 'Cable')
  const sensors = componentes.filter(c => c.tipoComponente === 'Sensor')
  
  console.log(`Cables: ${cables.length}, Sensors: ${sensors.length}`)
} catch (error) {
  console.error('Error fetching components:', error)
}
```

### `asignarComponenteAEquipo(componenteId: string, equipoId: string): Promise<void>`

Assigns an available component to a specific equipment.

**Parameters:**
- `componenteId`: ID of the component to assign
- `equipoId`: ID of the equipment to receive the component

**Returns:** Promise that resolves when assignment is complete

**Example:**
```typescript
import { asignarComponenteAEquipo } from '@/lib/database/equipos'

try {
  await asignarComponenteAEquipo('comp-123', 'equipo-456')
  console.log('Component assigned successfully')
} catch (error) {
  if (error.message.includes('component_not_available')) {
    console.error('Component is not available for assignment')
  } else if (error.message.includes('equipment_not_found')) {
    console.error('Equipment not found')
  } else {
    console.error('Error assigning component:', error)
  }
}
```

### `getHistorialAsignaciones(equipoId: string): Promise<AsignacionComponente[]>`

Retrieves the assignment history for a specific equipment.

**Parameters:**
- `equipoId`: ID of the equipment

**Returns:** Promise resolving to array of assignment records

**Example:**
```typescript
import { getHistorialAsignaciones } from '@/lib/database/equipos'

try {
  const historial = await getHistorialAsignaciones('equipo-456')
  console.log(`Assignment history: ${historial.length} records`)
  
  // Show recent assignments
  const recent = historial
    .sort((a, b) => new Date(b.fechaAsignacion) - new Date(a.fechaAsignacion))
    .slice(0, 5)
    
  console.log('Recent assignments:', recent)
} catch (error) {
  console.error('Error fetching assignment history:', error)
}
```

### `updateComponente(componenteId: string, updates: any): Promise<boolean>`

Updates component details such as status, observations, or location.

**Parameters:**
- `componenteId`: ID of the component to update
- `updates`: Object containing fields to update

**Returns:** Promise resolving to boolean indicating success

**Example:**
```typescript
import { updateComponente } from '@/lib/database/equipos'

try {
  const success = await updateComponente('comp-123', {
    estado: 'En reparacion',
    observaciones: 'Cable dañado, requiere reemplazo',
    ubicacionFisica: 'Taller de reparaciones'
  })
  
  if (success) {
    console.log('Component updated successfully')
  }
} catch (error) {
  console.error('Error updating component:', error)
}
```

### `createComponenteInventarioTecnico(componenteData: any): Promise<any>`

Creates a new technical inventory component.

**Parameters:**
- `componenteData`: Component data for technical inventory

**Returns:** Promise resolving to the created component

**Example:**
```typescript
import { createComponenteInventarioTecnico } from '@/lib/database/equipos'

const componenteData = {
  nombre: 'Placa Principal Monitor',
  marca: 'Philips',
  modelo: 'MX40-MB',
  numeroSerie: 'MB123456',
  tipoComponente: 'Placa Electronica',
  cantidadDisponible: 1,
  ubicacionFisica: 'Almacén Técnico - Estante A3',
  estado: 'Nuevo',
  codigoCargaOrigen: 'CARGA-2024-001',
  observaciones: 'Componente de repuesto para monitores MX40'
}

try {
  const componente = await createComponenteInventarioTecnico(componenteData)
  console.log('Technical component created:', componente.id)
} catch (error) {
  console.error('Error creating technical component:', error)
}
```

### `deleteEquipo(equipoId: string): Promise<void>`

Deletes an equipment and handles component reassignment.

**Parameters:**
- `equipoId`: ID of the equipment to delete

**Returns:** Promise that resolves when deletion is complete

**Example:**
```typescript
import { deleteEquipo } from '@/lib/database/equipos'

try {
  await deleteEquipo('equipo-456')
  console.log('Equipment deleted successfully')
  // Components are automatically returned to available inventory
} catch (error) {
  console.error('Error deleting equipment:', error)
}
```

## Types

### `EquipoInput`

Input interface for creating new equipment:

```typescript
export interface EquipoInput {
  cliente: string
  ubicacion: string
  nombreEquipo: string
  tipoEquipo: string
  marca: string
  modelo: string
  numeroSerieBase: string
  componentes: Array<{
    nombre: string
    numeroSerie: string
    estado: 'Operativo' | 'En reparacion' | 'Fuera de servicio'
    observaciones?: string
  }>
  accesorios?: string
  fechaEntrega: string
  observaciones?: string
}
```

### `ComponenteDisponible`

Interface for available components:

```typescript
export interface ComponenteDisponible {
  id: string
  nombre: string
  marca: string
  modelo: string
  numeroSerie: string
  tipoComponente: string
  cantidadDisponible: number
  cantidadOriginal: number
  ubicacionFisica: string
  estado: string
  observaciones: string
  fechaIngreso: string
  codigoCargaOrigen: string
  carpetaPrincipal: string
  rutaCarpeta: string
  tipoDestino: string
  createdAt: string
}
```

## Error Handling

Common error scenarios in equipment operations:

```typescript
try {
  const result = await equiposFunction(params)
  return result
} catch (error) {
  if (error.message.includes('duplicate_serial')) {
    console.error('❌ Equipment with this serial number already exists')
  } else if (error.message.includes('component_not_available')) {
    console.error('❌ Component is not available for assignment')
  } else if (error.message.includes('invalid_client')) {
    console.error('❌ Invalid client specified')
  } else {
    console.error('❌ Error in EquiposModule.functionName:', error)
    throw error
  }
}
```

## Integration Points

The Equipos module integrates with:

- **Mercaderias Module**: Creates equipment from merchandise loads
- **Stock Module**: Uses components from available inventory
- **Mantenimientos Module**: Provides equipment for maintenance operations
- **Supabase Tables**:
  - `equipos`
  - `componentes_equipo`
  - `componentes_disponibles`
  - `historial_asignaciones`

## Equipment Lifecycle

1. **Creation**: Equipment is created from merchandise or manually
2. **Component Assignment**: Components are assigned from available inventory
3. **Deployment**: Equipment is delivered to client location
4. **Maintenance**: Regular maintenance operations are performed
5. **Component Replacement**: Faulty components are replaced
6. **Retirement**: Equipment is eventually retired or transferred

## Performance Considerations

- Equipment queries include component data for complete information
- Component availability is cached for fast assignment operations
- Assignment history is paginated for large equipment
- Bulk operations are supported for multiple component assignments

## Best Practices

1. **Validate serial numbers** to prevent duplicates
2. **Check component availability** before assignment
3. **Maintain accurate locations** for equipment tracking
4. **Document component changes** with detailed observations
5. **Use proper equipment types** for better categorization
6. **Regular maintenance scheduling** based on equipment type
7. **Component lifecycle tracking** for replacement planning

## Testing

The module includes tests for:
- Equipment creation with various configurations
- Component assignment and availability tracking
- Equipment deletion and component handling
- Integration with other modules
- Error scenarios and edge cases

Example test:
```typescript
import { createEquipo, asignarComponenteAEquipo } from '@/lib/database/equipos'

describe('Equipos Module', () => {
  test('should create equipment and assign components', async () => {
    const equipoData = {
      cliente: 'Test Hospital',
      nombreEquipo: 'Test Monitor',
      // ... other required fields
    }
    
    const equipo = await createEquipo(equipoData)
    expect(equipo.id).toBeDefined()
    expect(equipo.componentes).toHaveLength(equipoData.componentes.length)
  })
})
```