# Database Module Documentation

## Overview

The database module has been refactored from a monolithic 3,270-line file into a modular, maintainable architecture. Each module focuses on a specific business domain while maintaining complete backward compatibility.

## Architecture

```
src/lib/database/
├── index.ts              # Central exports and backward compatibility
├── mercaderias.ts        # Merchandise management
├── stock.ts              # Inventory and stock movements
├── equipos.ts            # Equipment management
├── mantenimientos.ts     # Maintenance operations
├── clinicas.ts           # Clinic management
├── remisiones.ts         # Shipment management
├── usuarios.ts           # User management
└── shared/
    ├── supabase.ts       # Supabase client configuration
    ├── types.ts          # Shared TypeScript types
    ├── utils.ts          # Common utility functions
    ├── performance.ts    # Performance monitoring
    ├── lazy-loader.ts    # Module lazy loading
    └── bundle-optimization.ts # Bundle optimization
```

## Quick Start

### Basic Usage (Backward Compatible)
```typescript
// All existing imports continue to work
import { createCargaMercaderia, getAllStockItems } from '@/lib/database'

// Use functions exactly as before
const carga = await createCargaMercaderia(cargaData)
const stockItems = await getAllStockItems()
```

### New Modular Approach (Recommended)
```typescript
// Import from specific modules for better tree-shaking
import { createCargaMercaderia } from '@/lib/database/mercaderias'
import { getAllStockItems } from '@/lib/database/stock'
import { createEquipo } from '@/lib/database/equipos'

// Functions work exactly the same
const carga = await createCargaMercaderia(cargaData)
const stockItems = await getAllStockItems()
const equipo = await createEquipo(equipoData)
```

## Module Documentation

### [Mercaderias Module](./docs/mercaderias.md)
Handles all merchandise loading operations including product processing, stock integration, and equipment creation.

**Key Functions:**
- `createCargaMercaderia()` - Create new merchandise loads
- `getAllCargas()` - Retrieve all loads
- `generateCodigoCarga()` - Generate unique load codes

### [Stock Module](./docs/stock.md)
Manages inventory, stock movements, transactions, and traceability.

**Key Functions:**
- `getAllStockItems()` - Get all stock items
- `registrarMovimientoStock()` - Register stock movements
- `registrarSalidaStock()` - Register stock exits

### [Equipos Module](./docs/equipos.md)
Equipment management and component operations.

**Key Functions:**
- `createEquipo()` - Create new equipment
- `getAllEquipos()` - Get all equipment
- `asignarComponenteAEquipo()` - Assign components to equipment

### [Mantenimientos Module](./docs/mantenimientos.md)
Maintenance operations and tracking.

**Key Functions:**
- `createMantenimiento()` - Create new maintenance
- `getAllMantenimientos()` - Get all maintenances
- `updateMantenimiento()` - Update maintenance details

### [Clinicas Module](./docs/clinicas.md)
Clinic management operations.

**Key Functions:**
- `getAllClinicas()` - Get all clinics
- `createClinica()` - Create new clinic
- `updateClinica()` - Update clinic details

### [Remisiones Module](./docs/remisiones.md)
Shipment and delivery management.

**Key Functions:**
- `getAllRemisiones()` - Get all shipments
- `createRemision()` - Create new shipment
- `generateNumeroRemision()` - Generate shipment numbers

### [Usuarios Module](./docs/usuarios.md)
User management and statistics.

**Key Functions:**
- `getUsuariosReferenciados()` - Get referenced users
- `getEstadisticasUsuarios()` - Get user statistics

## Shared Utilities

### [Types](./docs/shared-types.md)
Common TypeScript interfaces and types used across modules.

### [Utils](./docs/shared-utils.md)
Common utility functions for error handling, logging, and validation.

### [Performance](./docs/shared-performance.md)
Performance monitoring and optimization utilities.

## Error Handling

All modules follow consistent error handling patterns:

```typescript
try {
  const result = await someFunction(params)
  return result
} catch (error) {
  console.error(`❌ Error in ModuleName.functionName:`, error)
  throw error
}
```

## Testing

Each module includes comprehensive unit tests:

```
src/lib/database/__tests__/
├── mercaderias.test.ts
├── stock.test.ts
├── equipos.test.ts
├── mantenimientos.test.ts
├── clinicas.test.ts
├── remisiones.test.ts
├── usuarios.test.ts
├── integration.test.ts
└── workflows.test.ts
```

## Performance Features

- **Lazy Loading**: Modules are loaded on-demand to reduce initial bundle size
- **Performance Monitoring**: Built-in performance tracking for critical operations
- **Bundle Optimization**: Tree-shaking friendly exports and code splitting
- **Memory Management**: Optimized memory usage patterns

## Migration Guide

See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions and best practices.

## Contributing

When adding new functionality:

1. Choose the appropriate module based on business domain
2. Follow existing patterns for error handling and logging
3. Add comprehensive tests for new functions
4. Update module documentation
5. Maintain backward compatibility

## Support

For questions or issues:
- Check the troubleshooting guide in [MIGRATION.md](./MIGRATION.md)
- Review module-specific documentation
- Check existing tests for usage examples