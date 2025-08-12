# Stock Module Documentation

## Overview

The Stock module manages inventory, stock movements, transactions, and traceability. It provides comprehensive tracking of all stock items, their movements, and maintains a complete audit trail for inventory management.

## Interface

```typescript
export interface StockModule extends DatabaseModule {
  getAllStockItems(): Promise<any[]>
  updateStockItemDetails(productId: string, updates: { imagen?: string; observaciones?: string }): Promise<boolean>
  updateComponenteDisponibleDetails(productId: string, updates: { imagen?: string; observaciones?: string }): Promise<boolean>
  registrarMovimientoStock(movimiento: any): Promise<any>
  getAllMovimientosStock(): Promise<MovimientoStock[]>
  getMovimientosByProducto(productoNombre: string, productoMarca?: string): Promise<MovimientoStock[]>
  getMovimientosByCarpeta(carpeta: string): Promise<MovimientoStock[]>
  getEstadisticasTrazabilidad(): Promise<any>
  getAllTransaccionesStock(): Promise<any[]>
  registrarSalidaStock(salidaData: any): Promise<boolean>
  registrarSalidaStockReporte(salidaData: any): Promise<boolean>
  devolverRepuestosAlStockReporte(devolucionData: any): Promise<boolean>
  createTransaccionStock(transaccionData: any): Promise<any>
  procesarSalidaStock(salidaData: any): Promise<boolean>
}
```

## Functions

### `getAllStockItems(): Promise<any[]>`

Retrieves all stock items in the system with their current quantities and details.

**Returns:** Promise resolving to array of all stock items

**Example:**
```typescript
import { getAllStockItems } from '@/lib/database/stock'

try {
  const stockItems = await getAllStockItems()
  console.log(`Found ${stockItems.length} stock items`)
  
  // Filter by low stock
  const lowStock = stockItems.filter(item => item.cantidadDisponible < 10)
  console.log(`Low stock items: ${lowStock.length}`)
} catch (error) {
  console.error('Error fetching stock items:', error)
}
```

### `registrarMovimientoStock(movimiento: MovimientoStockInput): Promise<any>`

Registers a stock movement for traceability and audit purposes.

**Parameters:**
- `movimiento`: Movement data including type, quantity, and reason

**Returns:** Promise resolving to the created movement record

**Example:**
```typescript
import { registrarMovimientoStock } from '@/lib/database/stock'

const movimiento = {
  stockItemId: 'stock-123',
  tipoMovimiento: 'Salida',
  cantidad: 5,
  cantidadAnterior: 20,
  cantidadNueva: 15,
  motivo: 'Uso en mantenimiento',
  descripcion: 'Repuestos utilizados en equipo X',
  usuarioResponsable: 'juan.perez',
  productoNombre: 'Filtro HEPA',
  productoMarca: 'Philips',
  itemType: 'stock_item'
}

try {
  const movement = await registrarMovimientoStock(movimiento)
  console.log('Movement registered:', movement.id)
} catch (error) {
  console.error('Error registering movement:', error)
}
```

### `getAllMovimientosStock(): Promise<MovimientoStock[]>`

Retrieves all stock movements for complete traceability.

**Returns:** Promise resolving to array of all stock movements

**Example:**
```typescript
import { getAllMovimientosStock } from '@/lib/database/stock'

try {
  const movements = await getAllMovimientosStock()
  console.log(`Total movements: ${movements.length}`)
  
  // Group by movement type
  const byType = movements.reduce((acc, mov) => {
    acc[mov.tipoMovimiento] = (acc[mov.tipoMovimiento] || 0) + 1
    return acc
  }, {})
  
  console.log('Movements by type:', byType)
} catch (error) {
  console.error('Error fetching movements:', error)
}
```

### `getMovimientosByProducto(productoNombre: string, productoMarca?: string): Promise<MovimientoStock[]>`

Retrieves stock movements for a specific product.

**Parameters:**
- `productoNombre`: Name of the product
- `productoMarca`: Optional brand filter

**Returns:** Promise resolving to array of movements for the product

**Example:**
```typescript
import { getMovimientosByProducto } from '@/lib/database/stock'

try {
  const movements = await getMovimientosByProducto('Jeringa 10ml', 'BD')
  console.log(`Found ${movements.length} movements for BD Jeringa 10ml`)
  
  // Calculate total usage
  const totalUsed = movements
    .filter(m => m.tipoMovimiento === 'Salida')
    .reduce((sum, m) => sum + m.cantidad, 0)
    
  console.log(`Total used: ${totalUsed}`)
} catch (error) {
  console.error('Error fetching product movements:', error)
}
```

### `registrarSalidaStock(salidaData: SalidaStockInput): Promise<boolean>`

Registers a stock exit, reducing available quantities and creating movement records.

**Parameters:**
- `salidaData`: Exit data including items and quantities

**Returns:** Promise resolving to boolean indicating success

**Example:**
```typescript
import { registrarSalidaStock } from '@/lib/database/stock'

const salidaData = {
  motivo: 'Mantenimiento preventivo',
  usuarioResponsable: 'maria.garcia',
  items: [
    {
      stockItemId: 'stock-123',
      cantidad: 2,
      observaciones: 'Para equipo UCI-001'
    },
    {
      stockItemId: 'stock-456',
      cantidad: 1,
      observaciones: 'Repuesto de emergencia'
    }
  ]
}

try {
  const success = await registrarSalidaStock(salidaData)
  if (success) {
    console.log('Stock exit registered successfully')
  } else {
    console.log('Stock exit failed - insufficient quantity')
  }
} catch (error) {
  console.error('Error registering stock exit:', error)
}
```

### `getAllTransaccionesStock(): Promise<any[]>`

Retrieves all stock transactions for financial and audit purposes.

**Returns:** Promise resolving to array of all stock transactions

**Example:**
```typescript
import { getAllTransaccionesStock } from '@/lib/database/stock'

try {
  const transactions = await getAllTransaccionesStock()
  console.log(`Total transactions: ${transactions.length}`)
  
  // Calculate total value
  const totalValue = transactions.reduce((sum, t) => sum + (t.valorTotal || 0), 0)
  console.log(`Total inventory value: $${totalValue.toFixed(2)}`)
} catch (error) {
  console.error('Error fetching transactions:', error)
}
```

### `updateStockItemDetails(productId: string, updates: UpdateData): Promise<boolean>`

Updates stock item details like images and observations.

**Parameters:**
- `productId`: ID of the stock item to update
- `updates`: Object containing fields to update

**Returns:** Promise resolving to boolean indicating success

**Example:**
```typescript
import { updateStockItemDetails } from '@/lib/database/stock'

try {
  const success = await updateStockItemDetails('stock-123', {
    imagen: 'https://example.com/new-image.jpg',
    observaciones: 'Updated specifications and usage notes'
  })
  
  if (success) {
    console.log('Stock item updated successfully')
  }
} catch (error) {
  console.error('Error updating stock item:', error)
}
```

## Types

### `MovimientoStock`

Interface for stock movement records:

```typescript
export interface MovimientoStock {
  id: string
  stockItemId?: string
  tipoMovimiento: 'Entrada' | 'Salida' | 'Ajuste' | 'Transferencia' | 'Asignacion'
  cantidad: number
  cantidadAnterior: number
  cantidadNueva: number
  motivo: string
  descripcion?: string
  referenciaExterna?: string
  usuarioResponsable?: string
  tecnicoResponsable?: string
  fechaMovimiento: string
  
  // Traceability fields
  productoNombre: string
  productoMarca?: string
  productoModelo?: string
  numeroSerie?: string
  codigoItem?: string
  codigoCargaOrigen?: string
  numeroFactura?: string
  cliente?: string
  costoUnitario?: number
  valorTotal?: number
  carpetaOrigen?: string
  carpetaDestino?: string
  ubicacionFisica?: string
  itemType: 'stock_item' | 'componente_disponible'
  
  createdAt: string
}
```

## Error Handling

Common error scenarios in stock operations:

```typescript
try {
  const result = await stockFunction(params)
  return result
} catch (error) {
  if (error.message.includes('insufficient_stock')) {
    console.error('❌ Insufficient stock for operation')
    // Handle insufficient stock
  } else if (error.message.includes('invalid_quantity')) {
    console.error('❌ Invalid quantity specified')
    // Handle validation error
  } else {
    console.error('❌ Error in StockModule.functionName:', error)
    throw error
  }
}
```

## Integration Points

The Stock module integrates with:

- **Mercaderias Module**: Receives stock from merchandise processing
- **Equipos Module**: Provides components for equipment assembly
- **Mantenimientos Module**: Supplies parts for maintenance operations
- **Remisiones Module**: Handles stock reduction for shipments
- **Supabase Tables**:
  - `stock_items`
  - `componentes_disponibles`
  - `movimientos_stock`
  - `transacciones_stock`

## Performance Considerations

- Stock movements are indexed for fast querying
- Large movement queries use pagination
- Real-time stock levels are cached for performance
- Batch operations are used for multiple item updates

## Traceability Features

The module provides complete traceability:

1. **Movement History**: Every stock change is recorded
2. **Source Tracking**: Links back to original merchandise loads
3. **Usage Tracking**: Records where items were used
4. **Cost Tracking**: Maintains cost information for financial reporting
5. **User Accountability**: Tracks who performed each operation

## Best Practices

1. **Always check stock levels** before registering exits
2. **Use descriptive motivos** for better traceability
3. **Include user information** for accountability
4. **Batch similar operations** for better performance
5. **Validate quantities** before processing movements
6. **Monitor stock levels** to prevent stockouts
7. **Use transactions** for operations affecting multiple items