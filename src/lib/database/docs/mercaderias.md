# Mercaderias Module Documentation

## Overview

The Mercaderias module handles all merchandise loading operations, including product processing, stock integration, and equipment creation. It's the most complex module in the system, managing the complete workflow from merchandise arrival to stock and equipment creation.

## Interface

```typescript
export interface MercaderiasModule {
  createCargaMercaderia(cargaData: CargaMercaderiaInput): Promise<CargaMercaderia>
  getCargaCompleta(cargaId: string): Promise<CargaMercaderia>
  getAllCargas(): Promise<CargaMercaderia[]>
  generateCodigoCarga(): Promise<string>
  createEquipoFromMercaderia(producto: any, carga: any, subitems?: any[]): Promise<Equipo>
  deleteCargaMercaderia(cargaId: string): Promise<void>
}
```

## Functions

### `createCargaMercaderia(cargaData: CargaMercaderiaInput): Promise<CargaMercaderia>`

Creates a new merchandise load with products and processes them for stock or equipment creation.

**Parameters:**
- `cargaData`: Object containing load information and products

**Returns:** Promise resolving to the created CargaMercaderia

**Example:**
```typescript
import { createCargaMercaderia } from '@/lib/database/mercaderias'

const cargaData = {
  tipoCarga: 'stock',
  cliente: 'Hospital Central',
  ubicacionServicio: 'Almacén Principal',
  observacionesGenerales: 'Carga de insumos médicos',
  productos: [
    {
      producto: 'Jeringa 10ml',
      tipoProducto: 'Insumo',
      marca: 'BD',
      modelo: 'Plastipak',
      cantidad: 100,
      paraStock: true,
      observaciones: 'Lote ABC123'
    }
  ]
}

try {
  const carga = await createCargaMercaderia(cargaData)
  console.log('Carga created:', carga.codigoCarga)
} catch (error) {
  console.error('Error creating carga:', error)
}
```

### `getCargaCompleta(cargaId: string): Promise<CargaMercaderia>`

Retrieves a complete merchandise load with all its products and subitems.

**Parameters:**
- `cargaId`: The ID of the load to retrieve

**Returns:** Promise resolving to the complete CargaMercaderia

**Example:**
```typescript
import { getCargaCompleta } from '@/lib/database/mercaderias'

try {
  const carga = await getCargaCompleta('carga-123')
  console.log('Load details:', carga)
  console.log('Products:', carga.productos)
} catch (error) {
  console.error('Error fetching carga:', error)
}
```

### `getAllCargas(): Promise<CargaMercaderia[]>`

Retrieves all merchandise loads in the system.

**Returns:** Promise resolving to array of all CargaMercaderia

**Example:**
```typescript
import { getAllCargas } from '@/lib/database/mercaderias'

try {
  const cargas = await getAllCargas()
  console.log(`Found ${cargas.length} loads`)
  
  // Filter by type
  const stockLoads = cargas.filter(c => c.tipoCarga === 'stock')
  console.log(`Stock loads: ${stockLoads.length}`)
} catch (error) {
  console.error('Error fetching cargas:', error)
}
```

### `generateCodigoCarga(): Promise<string>`

Generates a unique code for a new merchandise load.

**Returns:** Promise resolving to a unique string code

**Example:**
```typescript
import { generateCodigoCarga } from '@/lib/database/mercaderias'

try {
  const codigo = await generateCodigoCarga()
  console.log('Generated code:', codigo) // e.g., "CARGA-2024-001"
} catch (error) {
  console.error('Error generating code:', error)
}
```

### `createEquipoFromMercaderia(producto: any, carga: any, subitems?: any[]): Promise<Equipo>`

Creates equipment from merchandise products, typically used for medical equipment loads.

**Parameters:**
- `producto`: Product data from the merchandise load
- `carga`: Load data containing client and location information
- `subitems`: Optional array of subitems/components

**Returns:** Promise resolving to the created Equipo

**Example:**
```typescript
import { createEquipoFromMercaderia } from '@/lib/database/mercaderias'

const producto = {
  producto: 'Monitor de Signos Vitales',
  marca: 'Philips',
  modelo: 'IntelliVue MX40',
  numeroSerie: 'PH123456',
  tipoProducto: 'Equipo Médico'
}

const carga = {
  cliente: 'Hospital San Juan',
  ubicacionServicio: 'UCI'
}

const subitems = [
  { nombre: 'Cable ECG', numeroSerie: 'ECG001' },
  { nombre: 'Sensor SpO2', numeroSerie: 'SPO2001' }
]

try {
  const equipo = await createEquipoFromMercaderia(producto, carga, subitems)
  console.log('Equipment created:', equipo.id)
} catch (error) {
  console.error('Error creating equipment:', error)
}
```

### `deleteCargaMercaderia(cargaId: string): Promise<void>`

Deletes a merchandise load and all associated data.

**Parameters:**
- `cargaId`: The ID of the load to delete

**Returns:** Promise that resolves when deletion is complete

**Example:**
```typescript
import { deleteCargaMercaderia } from '@/lib/database/mercaderias'

try {
  await deleteCargaMercaderia('carga-123')
  console.log('Load deleted successfully')
} catch (error) {
  console.error('Error deleting load:', error)
}
```

## Types

### `CargaMercaderiaInput`

Input interface for creating new merchandise loads:

```typescript
export interface CargaMercaderiaInput {
  tipoCarga: 'stock' | 'cliente' | 'reparacion'
  cliente?: string
  ubicacionServicio?: string
  observacionesGenerales?: string
  numeroCargaPersonalizado?: string
  productos: Array<{
    producto: string
    tipoProducto: 'Insumo' | 'Repuesto' | 'Equipo Médico'
    marca: string
    modelo: string
    numeroSerie?: string
    cantidad: number
    observaciones?: string
    paraStock?: boolean
    paraServicioTecnico?: boolean
    imagen?: string
    subitems?: Array<{
      nombre: string
      numeroSerie?: string
      cantidad: number
      paraStock?: boolean
      paraServicioTecnico?: boolean
    }>
  }>
}
```

## Error Handling

All functions in this module follow consistent error handling patterns:

```typescript
try {
  const result = await mercaderiasFunction(params)
  return result
} catch (error) {
  console.error(`❌ Error in MercaderiasModule.functionName:`, error)
  throw error
}
```

Common error scenarios:
- **Database connection errors**: Network or Supabase connectivity issues
- **Validation errors**: Invalid input data or missing required fields
- **Duplicate code errors**: Attempting to create loads with existing codes
- **Foreign key errors**: References to non-existent clients or locations

## Integration Points

The Mercaderias module integrates with:

- **Stock Module**: Processes products for stock when `paraStock: true`
- **Equipos Module**: Creates equipment when `tipoProducto: 'Equipo Médico'`
- **Supabase Tables**: 
  - `cargas_mercaderia`
  - `productos_carga`
  - `subitems_producto`

## Performance Considerations

- Large loads with many products are processed in batches
- Stock processing is done asynchronously to avoid blocking
- Database transactions ensure data consistency
- Performance monitoring tracks load creation times

## Testing

The module includes comprehensive tests covering:
- Load creation with various product types
- Stock integration scenarios
- Equipment creation workflows
- Error handling and edge cases
- Performance benchmarks

Example test:
```typescript
import { createCargaMercaderia } from '@/lib/database/mercaderias'

describe('Mercaderias Module', () => {
  test('should create stock load successfully', async () => {
    const cargaData = {
      tipoCarga: 'stock',
      productos: [/* test products */]
    }
    
    const result = await createCargaMercaderia(cargaData)
    expect(result.codigoCarga).toBeDefined()
    expect(result.tipoCarga).toBe('stock')
  })
})
```

## Best Practices

1. **Always validate input data** before creating loads
2. **Use transactions** for operations affecting multiple tables
3. **Handle large loads** by processing products in batches
4. **Monitor performance** for loads with many products
5. **Provide meaningful error messages** for validation failures
6. **Use proper TypeScript types** for better IDE support