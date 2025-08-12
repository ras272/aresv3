# Remisiones Module Documentation

## Overview

The Remisiones module handles shipment and delivery management operations. It manages the complete shipment lifecycle from creation and stock integration to delivery tracking and restoration capabilities.

## Interface

```typescript
export interface RemisionesModule extends DatabaseModule {
  getAllRemisiones(): Promise<Remision[]>
  createRemision(remisionData: RemisionInput): Promise<Remision>
  updateRemision(remisionId: string, updates: RemisionUpdate): Promise<void>
  deleteRemision(remisionId: string): Promise<void>
  deleteRemisionConRestauracion(remisionId: string): Promise<void>
  generateNumeroRemision(): Promise<string>
  reducirStockPorRemision(remisionId: string): Promise<boolean>
}
```

## Functions

### `getAllRemisiones(): Promise<Remision[]>`

Retrieves all shipments in the system.

**Returns:** Promise resolving to array of all shipments

**Example:**
```typescript
import { getAllRemisiones } from '@/lib/database/remisiones'

try {
  const remisiones = await getAllRemisiones()
  console.log(`Found ${remisiones.length} shipments`)
  
  // Group by status
  const byStatus = remisiones.reduce((acc, remision) => {
    acc[remision.estado] = (acc[remision.estado] || 0) + 1
    return acc
  }, {})
  
  console.log('Shipments by status:', byStatus)
} catch (error) {
  console.error('Error fetching shipments:', error)
}
```

### `createRemision(remisionData: RemisionInput): Promise<Remision>`

Creates a new shipment record with items and stock integration.

**Parameters:**
- `remisionData`: Shipment data including destination, items, and delivery information

**Returns:** Promise resolving to the created Remision

**Example:**
```typescript
import { createRemision } from '@/lib/database/remisiones'

const remisionData = {
  numeroRemision: 'REM-2024-001', // Optional, will be generated if not provided
  cliente: 'Hospital Central',
  direccionEntrega: 'Av. Principal 123, Bogotá',
  fechaRemision: '2024-01-15',
  fechaEntregaEstimada: '2024-01-17',
  tipoRemision: 'Entrega',
  observaciones: 'Entrega urgente - equipo crítico',
  items: [
    {
      stockItemId: 'stock-123',
      cantidad: 2,
      descripcion: 'Monitor de signos vitales',
      observaciones: 'Incluye accesorios'
    },
    {
      stockItemId: 'stock-456',
      cantidad: 5,
      descripcion: 'Cables ECG',
      observaciones: 'Repuestos adicionales'
    }
  ]
}

try {
  const remision = await createRemision(remisionData)
  console.log('Shipment created:', remision.numeroRemision)
  console.log('Items:', remision.items.length)
} catch (error) {
  console.error('Error creating shipment:', error)
}
```

### `updateRemision(remisionId: string, updates: RemisionUpdate): Promise<void>`

Updates shipment details such as status, delivery information, or tracking data.

**Parameters:**
- `remisionId`: ID of the shipment to update
- `updates`: Object containing fields to update

**Returns:** Promise that resolves when update is complete

**Example:**
```typescript
import { updateRemision } from '@/lib/database/remisiones'

try {
  await updateRemision('rem-123', {
    estado: 'En Tránsito',
    fechaDespacho: '2024-01-15T14:30:00Z',
    transportista: 'TransMedical S.A.',
    numeroGuia: 'TM123456789',
    observacionesEntrega: 'Despachado vía terrestre'
  })
  
  console.log('Shipment updated successfully')
} catch (error) {
  console.error('Error updating shipment:', error)
}
```

### `generateNumeroRemision(): Promise<string>`

Generates a unique shipment number.

**Returns:** Promise resolving to a unique string number

**Example:**
```typescript
import { generateNumeroRemision } from '@/lib/database/remisiones'

try {
  const numero = await generateNumeroRemision()
  console.log('Generated number:', numero) // e.g., "REM-2024-001"
} catch (error) {
  console.error('Error generating shipment number:', error)
}
```

### `reducirStockPorRemision(remisionId: string): Promise<boolean>`

Reduces stock quantities based on shipment items.

**Parameters:**
- `remisionId`: ID of the shipment to process

**Returns:** Promise resolving to boolean indicating success

**Example:**
```typescript
import { reducirStockPorRemision } from '@/lib/database/remisiones'

try {
  const success = await reducirStockPorRemision('rem-123')
  if (success) {
    console.log('Stock reduced successfully')
  } else {
    console.log('Stock reduction failed - insufficient quantities')
  }
} catch (error) {
  console.error('Error reducing stock:', error)
}
```

### `deleteRemision(remisionId: string): Promise<void>`

Deletes a shipment record (without stock restoration).

**Parameters:**
- `remisionId`: ID of the shipment to delete

**Returns:** Promise that resolves when deletion is complete

**Example:**
```typescript
import { deleteRemision } from '@/lib/database/remisiones'

try {
  await deleteRemision('rem-123')
  console.log('Shipment deleted successfully')
} catch (error) {
  console.error('Error deleting shipment:', error)
}
```

### `deleteRemisionConRestauracion(remisionId: string): Promise<void>`

Deletes a shipment and restores stock quantities.

**Parameters:**
- `remisionId`: ID of the shipment to delete with stock restoration

**Returns:** Promise that resolves when deletion and restoration are complete

**Example:**
```typescript
import { deleteRemisionConRestauracion } from '@/lib/database/remisiones'

try {
  await deleteRemisionConRestauracion('rem-123')
  console.log('Shipment deleted and stock restored successfully')
} catch (error) {
  console.error('Error deleting shipment with restoration:', error)
}
```

## Types

### `RemisionInput`

Input interface for creating new shipments:

```typescript
export interface RemisionInput {
  numeroRemision?: string // Will be generated if not provided
  cliente: string
  direccionEntrega: string
  fechaRemision: string
  fechaEntregaEstimada?: string
  tipoRemision: 'Entrega' | 'Devolución' | 'Transferencia' | 'Préstamo'
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente'
  observaciones?: string
  items: Array<{
    stockItemId: string
    cantidad: number
    descripcion: string
    observaciones?: string
  }>
}
```

### `RemisionUpdate`

Interface for updating shipment records:

```typescript
export interface RemisionUpdate {
  estado?: 'Pendiente' | 'Preparando' | 'En Tránsito' | 'Entregado' | 'Cancelado'
  fechaDespacho?: string
  fechaEntregaReal?: string
  transportista?: string
  numeroGuia?: string
  personaRecibe?: string
  observacionesEntrega?: string
  evidenciaEntrega?: string // URL to delivery proof
  motivoCancelacion?: string
}
```

### `Remision`

Complete shipment record interface:

```typescript
export interface Remision {
  id: string
  numeroRemision: string
  cliente: string
  direccionEntrega: string
  fechaRemision: string
  fechaEntregaEstimada?: string
  fechaDespacho?: string
  fechaEntregaReal?: string
  tipoRemision: string
  estado: string
  prioridad: string
  transportista?: string
  numeroGuia?: string
  personaRecibe?: string
  observaciones?: string
  observacionesEntrega?: string
  evidenciaEntrega?: string
  motivoCancelacion?: string
  createdAt: string
  updatedAt: string
  
  // Related data
  items: RemisionItem[]
  movimientosStock?: MovimientoStock[]
}

export interface RemisionItem {
  id: string
  remisionId: string
  stockItemId: string
  cantidad: number
  descripcion: string
  observaciones?: string
  
  // Related stock item data
  stockItem?: StockItem
}
```

## Shipment Types

### Entrega
Standard delivery of equipment or supplies:
- New equipment installation
- Supply replenishment
- Scheduled deliveries
- Customer orders

### Devolución
Return of equipment or unused supplies:
- Equipment returns
- Unused supply returns
- Warranty returns
- End-of-lease returns

### Transferencia
Transfer between locations:
- Inter-clinic transfers
- Warehouse relocations
- Equipment redistribution
- Inventory balancing

### Préstamo
Temporary equipment loans:
- Emergency equipment loans
- Temporary replacements
- Trial equipment
- Backup equipment

## Shipment Workflow

1. **Creation**: Shipment is created with items and destination
2. **Stock Reduction**: Available stock is reduced for shipped items
3. **Preparation**: Items are prepared and packaged for shipment
4. **Dispatch**: Shipment is dispatched with tracking information
5. **Transit**: Shipment is in transit to destination
6. **Delivery**: Shipment is delivered and confirmed
7. **Completion**: Delivery is documented with evidence

## Error Handling

Common error scenarios in shipment operations:

```typescript
try {
  const result = await remisionesFunction(params)
  return result
} catch (error) {
  if (error.message.includes('insufficient_stock')) {
    console.error('❌ Insufficient stock for shipment items')
  } else if (error.message.includes('invalid_address')) {
    console.error('❌ Invalid delivery address')
  } else if (error.message.includes('duplicate_number')) {
    console.error('❌ Shipment number already exists')
  } else {
    console.error('❌ Error in RemisionesModule.functionName:', error)
    throw error
  }
}
```

## Integration Points

The Remisiones module integrates with:

- **Stock Module**: Reduces stock quantities for shipped items
- **Clinicas Module**: Links shipments to clinic destinations
- **Equipos Module**: May include equipment in shipments
- **Supabase Tables**:
  - `remisiones`
  - `items_remision`
  - `stock_items` (for quantity updates)
  - `movimientos_stock` (for tracking)

## Performance Considerations

- Shipment queries are indexed by date and status
- Stock integration uses database transactions for consistency
- Bulk operations are supported for multiple item shipments
- Tracking queries are optimized for real-time updates

## Tracking and Visibility

The module provides comprehensive tracking:

1. **Status Tracking**: Real-time shipment status updates
2. **Location Tracking**: Integration with carrier tracking systems
3. **Delivery Confirmation**: Photo and signature capture
4. **Exception Handling**: Delay and issue notifications
5. **Performance Metrics**: Delivery time and success rates

## Best Practices

1. **Validate stock availability** before creating shipments
2. **Use clear item descriptions** for easy identification
3. **Include delivery instructions** in observations
4. **Track shipments actively** for timely delivery
5. **Document delivery evidence** for audit trails
6. **Handle exceptions promptly** to maintain service levels
7. **Use appropriate priorities** for resource allocation

## Testing

The module includes comprehensive tests covering:
- Shipment creation with various item combinations
- Stock integration and quantity validation
- Status updates and workflow transitions
- Delivery confirmation and evidence handling
- Error scenarios and rollback operations

Example test:
```typescript
import { createRemision, reducirStockPorRemision } from '@/lib/database/remisiones'

describe('Remisiones Module', () => {
  test('should create shipment and reduce stock', async () => {
    const remisionData = {
      cliente: 'Test Hospital',
      direccionEntrega: 'Test Address',
      fechaRemision: '2024-01-15',
      tipoRemision: 'Entrega',
      items: [
        {
          stockItemId: 'test-stock',
          cantidad: 2,
          descripcion: 'Test Item'
        }
      ]
    }
    
    const remision = await createRemision(remisionData)
    expect(remision.numeroRemision).toBeDefined()
    expect(remision.items).toHaveLength(1)
    
    const success = await reducirStockPorRemision(remision.id)
    expect(success).toBe(true)
  })
})
```

## Reporting Features

The module supports various shipment reports:

1. **Shipment Log**: Complete shipment history
2. **Delivery Performance**: On-time delivery metrics
3. **Client Activity**: Shipments by client
4. **Item Analysis**: Most shipped items
5. **Geographic Distribution**: Shipments by location
6. **Cost Analysis**: Shipping costs and trends