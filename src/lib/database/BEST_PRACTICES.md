# Database Module Best Practices Guide

## Overview

This guide outlines best practices for working with the modular database architecture. Following these practices will help ensure maintainable, performant, and reliable code.

## Import Best Practices

### 1. Use Specific Module Imports

**✅ Recommended:**
```typescript
// Import from specific modules for better tree-shaking and clarity
import { createEquipo, getAllEquipos } from '@/lib/database/equipos'
import { registrarMovimientoStock } from '@/lib/database/stock'
import { createMantenimiento } from '@/lib/database/mantenimientos'
```

**❌ Avoid:**
```typescript
// Avoid importing from the main index unless necessary
import { createEquipo, registrarMovimientoStock, createMantenimiento } from '@/lib/database'
```

### 2. Group Related Imports

**✅ Recommended:**
```typescript
// Group imports by module and functionality
import { 
  createEquipo, 
  getAllEquipos, 
  deleteEquipo,
  asignarComponenteAEquipo 
} from '@/lib/database/equipos'

import { 
  createMantenimiento, 
  updateMantenimiento 
} from '@/lib/database/mantenimientos'
```

**❌ Avoid:**
```typescript
// Don't scatter related imports
import { createEquipo } from '@/lib/database/equipos'
import { createMantenimiento } from '@/lib/database/mantenimientos'
import { getAllEquipos } from '@/lib/database/equipos' // Should be grouped above
```

### 3. Use Type-Only Imports When Appropriate

**✅ Recommended:**
```typescript
// Separate runtime and type imports
import { createEquipo } from '@/lib/database/equipos'
import type { Equipo, EquipoInput } from '@/lib/database/shared/types'
```

## Error Handling Best Practices

### 1. Use Structured Error Handling

**✅ Recommended:**
```typescript
import { createEquipo } from '@/lib/database/equipos'
import { createDatabaseError } from '@/lib/database/shared/utils'

async function handleEquipmentCreation(equipoData: EquipoInput) {
  try {
    const equipo = await createEquipo(equipoData)
    return { success: true, data: equipo }
  } catch (error) {
    // Log the error with context
    console.error('Equipment creation failed:', {
      error: error.message,
      equipoData: equipoData.nombre,
      timestamp: new Date().toISOString()
    })
    
    // Return structured error response
    return { 
      success: false, 
      error: 'Failed to create equipment',
      details: error.message 
    }
  }
}
```

### 2. Handle Specific Error Types

**✅ Recommended:**
```typescript
import { createEquipo } from '@/lib/database/equipos'

async function createEquipmentSafely(equipoData: EquipoInput) {
  try {
    return await createEquipo(equipoData)
  } catch (error) {
    // Handle specific error types
    if (error.message.includes('duplicate_serial')) {
      throw new Error('Equipment with this serial number already exists')
    } else if (error.message.includes('invalid_client')) {
      throw new Error('Invalid client specified')
    } else if (error.message.includes('connection')) {
      throw new Error('Database connection failed. Please try again.')
    } else {
      // Re-throw unknown errors
      throw error
    }
  }
}
```

### 3. Use Result Wrappers for Complex Operations

**✅ Recommended:**
```typescript
import { createSuccessResult, createErrorResult } from '@/lib/database/shared/utils'

async function processEquipmentBatch(equipos: EquipoInput[]): Promise<DatabaseResult<Equipo[]>> {
  try {
    const results = await Promise.all(
      equipos.map(equipo => createEquipo(equipo))
    )
    return createSuccessResult(results)
  } catch (error) {
    return createErrorResult(error as DatabaseError)
  }
}
```

## Performance Best Practices

### 1. Use Appropriate Query Limits

**✅ Recommended:**
```typescript
import { getAllEquipos } from '@/lib/database/equipos'

// Always use reasonable limits for large datasets
async function getEquiposForDisplay() {
  const equipos = await getAllEquipos()
  // If the function doesn't support limits, implement pagination
  return equipos.slice(0, 100) // Limit to 100 items for UI
}
```

### 2. Implement Caching for Frequently Accessed Data

**✅ Recommended:**
```typescript
import { getAllClinicas } from '@/lib/database/clinicas'

// Simple in-memory cache for relatively static data
const clinicasCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getCachedClinicas() {
  const cached = clinicasCache.get('all_clinicas')
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const clinicas = await getAllClinicas()
  clinicasCache.set('all_clinicas', {
    data: clinicas,
    timestamp: Date.now()
  })
  
  return clinicas
}
```

### 3. Use Performance Monitoring

**✅ Recommended:**
```typescript
import { withPerformanceMonitoring } from '@/lib/database/shared/performance'
import { createEquipo } from '@/lib/database/equipos'

// Wrap critical operations with performance monitoring
const monitoredCreateEquipo = withPerformanceMonitoring(
  createEquipo,
  'createEquipo'
)

// Use the monitored version
const equipo = await monitoredCreateEquipo(equipoData)
```

## Data Validation Best Practices

### 1. Validate Input Data

**✅ Recommended:**
```typescript
import { validateData } from '@/lib/database/shared/utils'
import { createEquipo } from '@/lib/database/equipos'

const equipoValidationRules = [
  { field: 'nombre', required: true, type: 'string', minLength: 2 },
  { field: 'cliente', required: true, type: 'string', minLength: 1 },
  { field: 'numeroSerie', required: true, type: 'string', pattern: /^[A-Z0-9-]+$/ },
  { field: 'fechaEntrega', required: true, type: 'date' }
]

async function createValidatedEquipo(equipoData: EquipoInput) {
  // Validate input before processing
  const validation = validateData(equipoData, equipoValidationRules)
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
  }
  
  return await createEquipo(equipoData)
}
```

### 2. Sanitize User Input

**✅ Recommended:**
```typescript
import { sanitizeInput } from '@/lib/database/shared/utils'

async function createEquipoFromUserInput(rawInput: any) {
  const sanitizedData = {
    nombre: sanitizeInput(rawInput.nombre),
    cliente: sanitizeInput(rawInput.cliente),
    observaciones: sanitizeInput(rawInput.observaciones),
    // ... other fields
  }
  
  return await createEquipo(sanitizedData)
}
```

## Logging Best Practices

### 1. Use Structured Logging

**✅ Recommended:**
```typescript
import { createLogger } from '@/lib/database/shared/utils'

const logger = createLogger('EquipmentService')

async function createEquipoWithLogging(equipoData: EquipoInput) {
  logger.info('Starting equipment creation', 'createEquipo', {
    equipoName: equipoData.nombre,
    client: equipoData.cliente,
    timestamp: new Date().toISOString()
  })
  
  try {
    const equipo = await createEquipo(equipoData)
    
    logger.info('Equipment created successfully', 'createEquipo', {
      equipoId: equipo.id,
      equipoName: equipo.nombre,
      duration: Date.now() - startTime
    })
    
    return equipo
  } catch (error) {
    logger.error('Equipment creation failed', 'createEquipo', {
      error: error.message,
      equipoData: equipoData.nombre,
      stack: error.stack
    })
    throw error
  }
}
```

### 2. Use Appropriate Log Levels

**✅ Recommended:**
```typescript
const logger = createLogger('StockService')

async function processStockMovement(movimiento: MovimientoStock) {
  // Debug: Detailed information for development
  logger.debug('Processing stock movement', 'processStockMovement', {
    movementType: movimiento.tipoMovimiento,
    quantity: movimiento.cantidad
  })
  
  // Info: General information about normal operations
  logger.info('Stock movement registered', 'processStockMovement', {
    movementId: movimiento.id,
    type: movimiento.tipoMovimiento
  })
  
  // Warn: Potential issues that don't stop execution
  if (movimiento.cantidad > 100) {
    logger.warn('Large quantity movement detected', 'processStockMovement', {
      quantity: movimiento.cantidad,
      threshold: 100
    })
  }
  
  // Error: Actual problems that need attention
  if (error) {
    logger.error('Stock movement failed', 'processStockMovement', {
      error: error.message,
      movementData: movimiento
    })
  }
}
```

## Testing Best Practices

### 1. Test Module Functions Independently

**✅ Recommended:**
```typescript
// tests/equipos.test.ts
import { createEquipo, getAllEquipos } from '@/lib/database/equipos'

// Mock the Supabase client
jest.mock('@/lib/database/shared/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: mockEquipo, error: null }),
      select: jest.fn().mockResolvedValue({ data: [mockEquipo], error: null })
    }))
  }
}))

describe('Equipos Module', () => {
  test('should create equipment successfully', async () => {
    const equipoData = {
      nombre: 'Test Equipment',
      cliente: 'Test Client',
      // ... other required fields
    }
    
    const result = await createEquipo(equipoData)
    
    expect(result).toBeDefined()
    expect(result.nombre).toBe('Test Equipment')
  })
  
  test('should handle creation errors gracefully', async () => {
    // Mock error scenario
    const supabase = require('@/lib/database/shared/supabase').supabase
    supabase.from().insert.mockResolvedValueOnce({ 
      data: null, 
      error: { message: 'Duplicate serial number' } 
    })
    
    await expect(createEquipo(equipoData)).rejects.toThrow('Duplicate serial number')
  })
})
```

### 2. Test Integration Between Modules

**✅ Recommended:**
```typescript
// tests/integration.test.ts
import { createCargaMercaderia } from '@/lib/database/mercaderias'
import { getAllStockItems } from '@/lib/database/stock'
import { createEquipo } from '@/lib/database/equipos'

describe('Module Integration', () => {
  test('merchandise processing should create stock and equipment', async () => {
    // Create merchandise load
    const carga = await createCargaMercaderia({
      tipoCarga: 'stock',
      productos: [mockProducto]
    })
    
    // Verify stock was created
    const stockItems = await getAllStockItems()
    expect(stockItems.some(item => item.codigoCargaOrigen === carga.codigoCarga)).toBe(true)
    
    // Verify equipment was created if applicable
    if (mockProducto.tipoProducto === 'Equipo Médico') {
      const equipos = await getAllEquipos()
      expect(equipos.some(equipo => equipo.codigoCargaOrigen === carga.codigoCarga)).toBe(true)
    }
  })
})
```

## Security Best Practices

### 1. Validate and Sanitize All Inputs

**✅ Recommended:**
```typescript
import { sanitizeInput, validateData } from '@/lib/database/shared/utils'

async function createSecureEquipo(rawInput: any) {
  // Sanitize all string inputs
  const sanitizedInput = {
    nombre: sanitizeInput(rawInput.nombre),
    cliente: sanitizeInput(rawInput.cliente),
    observaciones: sanitizeInput(rawInput.observaciones),
    numeroSerie: rawInput.numeroSerie?.replace(/[^A-Z0-9-]/g, ''), // Allow only alphanumeric and hyphens
  }
  
  // Validate the sanitized input
  const validation = validateData(sanitizedInput, equipoValidationRules)
  if (!validation.isValid) {
    throw new Error('Invalid input data')
  }
  
  return await createEquipo(sanitizedInput)
}
```

### 2. Use Proper Access Control

**✅ Recommended:**
```typescript
async function createEquipoWithAuth(equipoData: EquipoInput, userContext: UserContext) {
  // Check user permissions
  if (!userContext.hasPermission('CREATE_EQUIPMENT')) {
    throw new Error('Insufficient permissions to create equipment')
  }
  
  // Add audit trail information
  const equipoWithAudit = {
    ...equipoData,
    createdBy: userContext.userId,
    createdAt: new Date().toISOString()
  }
  
  return await createEquipo(equipoWithAudit)
}
```

## Code Organization Best Practices

### 1. Keep Functions Focused and Small

**✅ Recommended:**
```typescript
// Good: Small, focused functions
async function validateEquipoData(data: EquipoInput): Promise<ValidationResult> {
  return validateData(data, equipoValidationRules)
}

async function createEquipoRecord(data: EquipoInput): Promise<Equipo> {
  return await createEquipo(data)
}

async function logEquipoCreation(equipo: Equipo): Promise<void> {
  logger.info('Equipment created', 'createEquipo', { equipoId: equipo.id })
}

// Compose them together
async function processEquipoCreation(data: EquipoInput): Promise<Equipo> {
  const validation = await validateEquipoData(data)
  if (!validation.isValid) {
    throw new Error('Validation failed')
  }
  
  const equipo = await createEquipoRecord(data)
  await logEquipoCreation(equipo)
  
  return equipo
}
```

### 2. Use Consistent Naming Conventions

**✅ Recommended:**
```typescript
// Use consistent prefixes for similar operations
async function createEquipo(data: EquipoInput): Promise<Equipo>
async function createMantenimiento(data: MantenimientoInput): Promise<Mantenimiento>
async function createRemision(data: RemisionInput): Promise<Remision>

// Use consistent suffixes for similar data types
interface EquipoInput { /* ... */ }
interface MantenimientoInput { /* ... */ }
interface RemisionInput { /* ... */ }

// Use descriptive function names
async function getEquiposByClient(clientId: string): Promise<Equipo[]>
async function getActiveMantenimientos(): Promise<Mantenimiento[]>
async function getPendingRemisiones(): Promise<Remision[]>
```

### 3. Document Complex Business Logic

**✅ Recommended:**
```typescript
/**
 * Creates equipment from merchandise and processes components
 * 
 * This function handles the complex workflow of:
 * 1. Creating the main equipment record
 * 2. Processing individual components
 * 3. Assigning components to the equipment
 * 4. Updating stock levels
 * 5. Creating audit trail records
 * 
 * @param producto - Product data from merchandise load
 * @param carga - Load information including client and location
 * @param subitems - Optional array of component subitems
 * @returns Promise resolving to the created equipment
 */
async function createEquipoFromMercaderia(
  producto: any, 
  carga: any, 
  subitems?: any[]
): Promise<Equipo> {
  // Implementation with clear steps matching the documentation
}
```

## Deployment Best Practices

### 1. Environment-Specific Configuration

**✅ Recommended:**
```typescript
// config/database.ts
const databaseConfig = {
  development: {
    enableLogging: true,
    enablePerformanceMonitoring: true,
    cacheTimeout: 60000 // 1 minute
  },
  production: {
    enableLogging: false,
    enablePerformanceMonitoring: true,
    cacheTimeout: 300000 // 5 minutes
  }
}

export const config = databaseConfig[process.env.NODE_ENV || 'development']
```

### 2. Health Checks

**✅ Recommended:**
```typescript
// utils/health-check.ts
import { supabase } from '@/lib/database/shared/supabase'

export async function checkDatabaseHealth(): Promise<HealthStatus> {
  try {
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('clinicas')
      .select('count')
      .limit(1)
    
    if (error) throw error
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}
```

## Monitoring and Observability

### 1. Track Key Metrics

**✅ Recommended:**
```typescript
import { performanceMonitor } from '@/lib/database/shared/performance'

// Track business metrics
async function createEquipoWithMetrics(equipoData: EquipoInput) {
  const monitor = performanceMonitor.start('createEquipo')
  
  try {
    const equipo = await createEquipo(equipoData)
    
    // Record success metrics
    monitor.success({
      equipmentType: equipoData.tipoEquipo,
      client: equipoData.cliente,
      componentCount: equipoData.componentes?.length || 0
    })
    
    return equipo
  } catch (error) {
    // Record failure metrics
    monitor.error(error, {
      equipmentType: equipoData.tipoEquipo,
      errorType: error.constructor.name
    })
    throw error
  }
}
```

### 2. Set Up Alerts

**✅ Recommended:**
```typescript
import { setupPerformanceAlerts } from '@/lib/database/shared/performance'

// Configure alerts for critical thresholds
setupPerformanceAlerts({
  thresholds: {
    responseTime: 2000, // 2 seconds
    errorRate: 5, // 5%
    memoryUsage: 85 // 85%
  },
  notifications: {
    email: process.env.ALERT_EMAIL,
    webhook: process.env.ALERT_WEBHOOK
  }
})
```

## Common Anti-Patterns to Avoid

### ❌ Don't Mix Business Logic with Database Operations

```typescript
// Bad: Business logic mixed with database operations
async function createEquipo(equipoData: EquipoInput) {
  // Database operation
  const equipo = await supabase.from('equipos').insert(equipoData)
  
  // Business logic mixed in
  if (equipoData.tipoEquipo === 'Critical') {
    await sendUrgentNotification(equipo)
    await scheduleImmediateMaintenance(equipo)
  }
  
  return equipo
}

// Good: Separate concerns
async function createEquipo(equipoData: EquipoInput): Promise<Equipo> {
  return await supabase.from('equipos').insert(equipoData)
}

async function processEquipoCreation(equipoData: EquipoInput): Promise<Equipo> {
  const equipo = await createEquipo(equipoData)
  
  // Handle business logic separately
  if (equipoData.tipoEquipo === 'Critical') {
    await handleCriticalEquipment(equipo)
  }
  
  return equipo
}
```

### ❌ Don't Ignore Error Handling

```typescript
// Bad: No error handling
async function createEquipo(equipoData: EquipoInput) {
  const equipo = await supabase.from('equipos').insert(equipoData)
  return equipo.data // Could be null if error occurred
}

// Good: Proper error handling
async function createEquipo(equipoData: EquipoInput): Promise<Equipo> {
  const { data, error } = await supabase.from('equipos').insert(equipoData)
  
  if (error) {
    throw new Error(`Failed to create equipment: ${error.message}`)
  }
  
  return data
}
```

### ❌ Don't Use Magic Numbers or Strings

```typescript
// Bad: Magic numbers and strings
async function getRecentEquipos() {
  const equipos = await getAllEquipos()
  return equipos.filter(e => e.estado === 'Operativo').slice(0, 50)
}

// Good: Named constants
const EQUIPMENT_STATUS = {
  OPERATIONAL: 'Operativo',
  MAINTENANCE: 'En Mantenimiento',
  OUT_OF_SERVICE: 'Fuera de Servicio'
} as const

const DEFAULT_PAGE_SIZE = 50

async function getRecentEquipos() {
  const equipos = await getAllEquipos()
  return equipos
    .filter(e => e.estado === EQUIPMENT_STATUS.OPERATIONAL)
    .slice(0, DEFAULT_PAGE_SIZE)
}
```

## Code Review Checklist

When reviewing database-related code, check for:

- [ ] **Imports**: Using specific module imports instead of main index
- [ ] **Error Handling**: Proper try-catch blocks and error messages
- [ ] **Validation**: Input validation before database operations
- [ ] **Logging**: Appropriate logging with structured data
- [ ] **Performance**: Reasonable query limits and caching where appropriate
- [ ] **Security**: Input sanitization and access control
- [ ] **Testing**: Unit tests for new functions
- [ ] **Documentation**: Clear comments for complex business logic
- [ ] **Consistency**: Following established naming conventions
- [ ] **Type Safety**: Proper TypeScript types and interfaces

Following these best practices will help maintain a high-quality, maintainable, and performant database layer.