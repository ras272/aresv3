# Shared Types Documentation

## Overview

The shared types module provides common TypeScript interfaces and types used across all database modules. It ensures consistency and type safety throughout the system.

## Core Interfaces

### `ModuleConfig`

Configuration interface for database modules:

```typescript
export interface ModuleConfig {
  supabaseClient: SupabaseClient
  enableLogging?: boolean
  enableErrorReporting?: boolean
}
```

**Usage:**
```typescript
import { ModuleConfig } from '@/lib/database/shared/types'

const config: ModuleConfig = {
  supabaseClient: supabase,
  enableLogging: true,
  enableErrorReporting: false
}
```

### `DatabaseModule`

Base interface that all database modules implement:

```typescript
export interface DatabaseModule {
  initialize(config: ModuleConfig): Promise<void>
  cleanup?(): Promise<void>
}
```

**Usage:**
```typescript
export class MercaderiasModule implements DatabaseModule {
  async initialize(config: ModuleConfig): Promise<void> {
    // Module initialization logic
  }
  
  async cleanup(): Promise<void> {
    // Optional cleanup logic
  }
}
```

## Error Handling Types

### `DatabaseError`

Extended error interface for database operations:

```typescript
export interface DatabaseError extends Error {
  code?: string
  details?: string
  hint?: string
  message: string
}
```

**Usage:**
```typescript
import { createDatabaseError } from '@/lib/database/shared/utils'

const error = createDatabaseError(
  'Failed to create record',
  'UNIQUE_VIOLATION',
  'Duplicate key value violates unique constraint',
  'Ensure the record does not already exist'
)
```

### `DatabaseResult<T>`

Standardized result wrapper for database operations:

```typescript
export interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
  success: boolean
}
```

**Usage:**
```typescript
import { createSuccessResult, createErrorResult } from '@/lib/database/shared/utils'

// Success case
const successResult = createSuccessResult(userData)

// Error case
const errorResult = createErrorResult<User>(databaseError)
```

## Operation Types

### `OperationResult`

Generic result interface for operations:

```typescript
export interface OperationResult {
  success: boolean
  error?: string
  data?: any
}
```

### `PaginationOptions`

Interface for pagination parameters:

```typescript
export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}
```

**Usage:**
```typescript
const pagination: PaginationOptions = {
  page: 1,
  limit: 20,
  offset: 0
}
```

### `SortOptions`

Interface for sorting parameters:

```typescript
export interface SortOptions {
  column: string
  ascending?: boolean
}
```

**Usage:**
```typescript
const sort: SortOptions = {
  column: 'createdAt',
  ascending: false
}
```

### `FilterOptions`

Flexible interface for filtering parameters:

```typescript
export interface FilterOptions {
  [key: string]: any
}
```

### `QueryOptions`

Combined interface for query parameters:

```typescript
export interface QueryOptions {
  pagination?: PaginationOptions
  sort?: SortOptions
  filters?: FilterOptions
}
```

**Usage:**
```typescript
const queryOptions: QueryOptions = {
  pagination: { page: 1, limit: 10 },
  sort: { column: 'nombre', ascending: true },
  filters: { activo: true, ciudad: 'Bogotá' }
}
```

## Audit and Tracking Types

### `AuditTrail`

Interface for tracking data changes:

```typescript
export interface AuditTrail {
  id: string
  tableName: string
  recordId: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  userId?: string
  timestamp: string
}
```

**Usage:**
```typescript
const auditRecord: AuditTrail = {
  id: 'audit-123',
  tableName: 'equipos',
  recordId: 'equipo-456',
  operation: 'UPDATE',
  oldValues: { estado: 'Operativo' },
  newValues: { estado: 'En Mantenimiento' },
  userId: 'user-789',
  timestamp: new Date().toISOString()
}
```

## CRUD Operation Types

### `CreateInput<T>`

Generic interface for create operations:

```typescript
export interface CreateInput<T> {
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
}
```

### `UpdateInput<T>`

Generic interface for update operations:

```typescript
export interface UpdateInput<T> {
  id: string
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
}
```

### `DeleteInput`

Interface for delete operations:

```typescript
export interface DeleteInput {
  id: string
}
```

**Usage:**
```typescript
// Create operation
const createData: CreateInput<Equipo> = {
  data: {
    nombre: 'Monitor Philips',
    cliente: 'Hospital Central',
    // ... other fields except id, createdAt, updatedAt
  }
}

// Update operation
const updateData: UpdateInput<Equipo> = {
  id: 'equipo-123',
  data: {
    estado: 'En Mantenimiento',
    observaciones: 'Requiere calibración'
  }
}
```

## Validation Types

### `ValidationRule`

Interface for defining validation rules:

```typescript
export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url'
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  customValidator?: (value: any) => boolean | string
}
```

### `ValidationResult`

Interface for validation results:

```typescript
export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
  }>
}
```

**Usage:**
```typescript
import { validateData } from '@/lib/database/shared/utils'

const rules: ValidationRule[] = [
  {
    field: 'nombre',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    field: 'email',
    required: false,
    type: 'email'
  }
]

const result = validateData(userData, rules)
if (!result.isValid) {
  console.error('Validation errors:', result.errors)
}
```

## Logging Types

### `LogEntry`

Interface for log entries:

```typescript
export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  module: string
  function: string
  timestamp: string
  metadata?: Record<string, any>
}
```

**Usage:**
```typescript
import { createLogger } from '@/lib/database/shared/utils'

const logger = createLogger('MercaderiasModule')
logger.info('Processing merchandise load', 'createCargaMercaderia', { 
  loadId: 'carga-123',
  itemCount: 5 
})
```

## Type Utilities

### Re-exported Types

The module re-exports all types from the main types file:

```typescript
// Re-export all existing types from the main types file for convenience
export * from '../../../types'
```

This includes:
- `CargaMercaderia`
- `Equipo`
- `Mantenimiento`
- `StockItem`
- `Clinica`
- `Remision`
- And all other application-specific types

## Best Practices

### Type Safety
```typescript
// Use generic types for better type safety
function processData<T>(data: CreateInput<T>): Promise<T> {
  // Implementation
}
```

### Consistent Error Handling
```typescript
// Always use DatabaseResult for operations that can fail
async function createRecord<T>(data: T): Promise<DatabaseResult<T>> {
  try {
    const result = await database.create(data)
    return createSuccessResult(result)
  } catch (error) {
    return createErrorResult(error as DatabaseError)
  }
}
```

### Validation
```typescript
// Define validation rules for all input types
const equipoValidationRules: ValidationRule[] = [
  { field: 'nombre', required: true, type: 'string', minLength: 1 },
  { field: 'cliente', required: true, type: 'string', minLength: 1 },
  { field: 'numeroSerie', required: true, type: 'string', pattern: /^[A-Z0-9]+$/ }
]
```

### Logging
```typescript
// Use structured logging with metadata
logger.info('Operation completed', 'functionName', {
  duration: 150,
  recordsProcessed: 25,
  success: true
})
```

## Migration Guide

When updating shared types:

1. **Backward Compatibility**: Ensure new types don't break existing code
2. **Deprecation**: Mark old types as deprecated before removal
3. **Documentation**: Update all affected module documentation
4. **Testing**: Update tests to use new type definitions
5. **Gradual Migration**: Allow time for modules to adopt new types

## Common Patterns

### Result Wrapping
```typescript
// Wrap all database operations in DatabaseResult
async function getUser(id: string): Promise<DatabaseResult<User>> {
  try {
    const user = await database.users.findById(id)
    return createSuccessResult(user)
  } catch (error) {
    return createErrorResult(error as DatabaseError)
  }
}
```

### Input Validation
```typescript
// Validate all inputs before processing
async function createEquipo(input: CreateInput<Equipo>): Promise<DatabaseResult<Equipo>> {
  const validation = validateData(input.data, equipoValidationRules)
  if (!validation.isValid) {
    return createErrorResult(createDatabaseError('Validation failed'))
  }
  
  // Proceed with creation
}
```

### Consistent Logging
```typescript
// Use consistent logging patterns across modules
const logger = createLogger('ModuleName')

async function moduleFunction(params: any): Promise<any> {
  logger.info('Function started', 'moduleFunction', { params })
  
  try {
    const result = await processData(params)
    logger.info('Function completed', 'moduleFunction', { result })
    return result
  } catch (error) {
    logger.error('Function failed', 'moduleFunction', { error: error.message })
    throw error
  }
}
```