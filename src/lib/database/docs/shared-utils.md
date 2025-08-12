# Shared Utils Documentation

## Overview

The shared utils module provides common utility functions for error handling, logging, validation, and other cross-cutting concerns used throughout the database modules.

## Error Handling Utilities

### `createDatabaseError(message, code?, details?, hint?): DatabaseError`

Creates a standardized database error with optional metadata.

**Parameters:**
- `message`: Error message
- `code`: Optional error code
- `details`: Optional detailed error information
- `hint`: Optional hint for resolving the error

**Returns:** DatabaseError object

**Example:**
```typescript
import { createDatabaseError } from '@/lib/database/shared/utils'

const error = createDatabaseError(
  'Failed to create equipment',
  'UNIQUE_VIOLATION',
  'Duplicate serial number: ABC123',
  'Check if equipment with this serial number already exists'
)

throw error
```

### `createSuccessResult<T>(data): DatabaseResult<T>`

Creates a success result wrapper for database operations.

**Parameters:**
- `data`: The successful operation result

**Returns:** DatabaseResult with success flag and data

**Example:**
```typescript
import { createSuccessResult } from '@/lib/database/shared/utils'

async function getEquipo(id: string): Promise<DatabaseResult<Equipo>> {
  try {
    const equipo = await database.equipos.findById(id)
    return createSuccessResult(equipo)
  } catch (error) {
    return createErrorResult(error as DatabaseError)
  }
}
```

### `createErrorResult<T>(error): DatabaseResult<T>`

Creates an error result wrapper for failed database operations.

**Parameters:**
- `error`: The DatabaseError that occurred

**Returns:** DatabaseResult with error flag and error details

**Example:**
```typescript
import { createErrorResult, createDatabaseError } from '@/lib/database/shared/utils'

async function createEquipo(data: EquipoInput): Promise<DatabaseResult<Equipo>> {
  try {
    const equipo = await database.equipos.create(data)
    return createSuccessResult(equipo)
  } catch (error) {
    const dbError = createDatabaseError(
      'Failed to create equipment',
      'CREATE_FAILED',
      error.message
    )
    return createErrorResult(dbError)
  }
}
```

## Logging Utilities

### `createLogger(moduleName): Logger`

Creates a structured logger for a specific module.

**Parameters:**
- `moduleName`: Name of the module for log identification

**Returns:** Logger object with info, warn, error, and debug methods

**Example:**
```typescript
import { createLogger } from '@/lib/database/shared/utils'

const logger = createLogger('MercaderiasModule')

// Log different levels with metadata
logger.info('Processing merchandise load', 'createCargaMercaderia', {
  loadId: 'carga-123',
  itemCount: 5,
  client: 'Hospital Central'
})

logger.warn('Low stock detected', 'checkStockLevels', {
  item: 'Jeringa 10ml',
  currentStock: 5,
  minimumStock: 10
})

logger.error('Database connection failed', 'connectToDatabase', {
  error: 'Connection timeout',
  retryAttempt: 3
})

logger.debug('Query executed', 'getAllEquipos', {
  query: 'SELECT * FROM equipos',
  executionTime: 150,
  resultCount: 25
})
```

### Logger Methods

Each logger provides four logging levels:

#### `logger.info(message, functionName, metadata?)`
For general information and successful operations.

#### `logger.warn(message, functionName, metadata?)`
For warnings and potential issues that don't stop execution.

#### `logger.error(message, functionName, metadata?)`
For errors and failures that require attention.

#### `logger.debug(message, functionName, metadata?)`
For detailed debugging information (only shown in development).

## Validation Utilities

### `validateData(data, rules): ValidationResult`

Validates data against a set of validation rules.

**Parameters:**
- `data`: Object containing data to validate
- `rules`: Array of ValidationRule objects

**Returns:** ValidationResult with isValid flag and error details

**Example:**
```typescript
import { validateData, ValidationRule } from '@/lib/database/shared/utils'

const equipoValidationRules: ValidationRule[] = [
  {
    field: 'nombre',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    field: 'numeroSerie',
    required: true,
    type: 'string',
    pattern: /^[A-Z0-9-]+$/
  },
  {
    field: 'email',
    required: false,
    type: 'email'
  },
  {
    field: 'fechaEntrega',
    required: true,
    type: 'date'
  },
  {
    field: 'costo',
    required: false,
    type: 'number',
    customValidator: (value) => {
      if (value < 0) return 'Cost cannot be negative'
      return true
    }
  }
]

const equipoData = {
  nombre: 'Monitor Philips',
  numeroSerie: 'PH-123-456',
  email: 'invalid-email',
  fechaEntrega: '2024-01-15',
  costo: -100
}

const result = validateData(equipoData, equipoValidationRules)

if (!result.isValid) {
  console.error('Validation errors:')
  result.errors.forEach(error => {
    console.error(`- ${error.field}: ${error.message}`)
  })
}
```

### Validation Rule Types

#### Required Field Validation
```typescript
{
  field: 'nombre',
  required: true
}
```

#### Type Validation
```typescript
{
  field: 'email',
  type: 'email'  // 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url'
}
```

#### Length Validation
```typescript
{
  field: 'descripcion',
  minLength: 10,
  maxLength: 500
}
```

#### Pattern Validation
```typescript
{
  field: 'numeroSerie',
  pattern: /^[A-Z0-9-]+$/
}
```

#### Custom Validation
```typescript
{
  field: 'fechaEntrega',
  customValidator: (value) => {
    const date = new Date(value)
    const today = new Date()
    if (date < today) {
      return 'Delivery date cannot be in the past'
    }
    return true
  }
}
```

## Utility Functions

### `formatDate(date, format?): string`

Formats dates consistently across the application.

**Example:**
```typescript
import { formatDate } from '@/lib/database/shared/utils'

const date = new Date('2024-01-15T10:30:00Z')
console.log(formatDate(date)) // '2024-01-15'
console.log(formatDate(date, 'datetime')) // '2024-01-15 10:30:00'
console.log(formatDate(date, 'time')) // '10:30:00'
```

### `generateId(prefix?): string`

Generates unique identifiers with optional prefix.

**Example:**
```typescript
import { generateId } from '@/lib/database/shared/utils'

const equipoId = generateId('equipo') // 'equipo-abc123def456'
const genericId = generateId() // 'abc123def456'
```

### `sanitizeInput(input): string`

Sanitizes user input to prevent injection attacks.

**Example:**
```typescript
import { sanitizeInput } from '@/lib/database/shared/utils'

const userInput = "<script>alert('xss')</script>Hello"
const sanitized = sanitizeInput(userInput) // "Hello"
```

### `deepClone<T>(obj): T`

Creates a deep copy of an object.

**Example:**
```typescript
import { deepClone } from '@/lib/database/shared/utils'

const original = {
  name: 'Equipment',
  components: [{ name: 'Cable', serial: '123' }]
}

const copy = deepClone(original)
copy.components[0].serial = '456'
console.log(original.components[0].serial) // Still '123'
```

### `isEmpty(value): boolean`

Checks if a value is empty (null, undefined, empty string, empty array, empty object).

**Example:**
```typescript
import { isEmpty } from '@/lib/database/shared/utils'

console.log(isEmpty(null)) // true
console.log(isEmpty('')) // true
console.log(isEmpty([])) // true
console.log(isEmpty({})) // true
console.log(isEmpty('hello')) // false
console.log(isEmpty([1, 2, 3])) // false
```

## Performance Utilities

### `debounce(func, delay): Function`

Creates a debounced version of a function.

**Example:**
```typescript
import { debounce } from '@/lib/database/shared/utils'

const debouncedSearch = debounce(async (query: string) => {
  const results = await searchEquipos(query)
  updateSearchResults(results)
}, 300)

// Usage in search input
searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value)
})
```

### `throttle(func, limit): Function`

Creates a throttled version of a function.

**Example:**
```typescript
import { throttle } from '@/lib/database/shared/utils'

const throttledSave = throttle(async (data: any) => {
  await saveToDatabase(data)
}, 1000)

// Usage for auto-save
dataInput.addEventListener('input', (e) => {
  throttledSave(e.target.value)
})
```

### `retry(func, maxAttempts, delay?): Promise<T>`

Retries a function with exponential backoff.

**Example:**
```typescript
import { retry } from '@/lib/database/shared/utils'

const result = await retry(
  async () => {
    return await unstableApiCall()
  },
  3, // max attempts
  1000 // initial delay in ms
)
```

## Data Transformation Utilities

### `transformKeys(obj, transformer): Object`

Transforms object keys using a transformer function.

**Example:**
```typescript
import { transformKeys } from '@/lib/database/shared/utils'

const camelCase = (str: string) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

const dbRecord = {
  equipo_id: '123',
  numero_serie: 'ABC123',
  fecha_creacion: '2024-01-15'
}

const jsObject = transformKeys(dbRecord, camelCase)
// Result: { equipoId: '123', numeroSerie: 'ABC123', fechaCreacion: '2024-01-15' }
```

### `filterObject(obj, predicate): Object`

Filters object properties based on a predicate function.

**Example:**
```typescript
import { filterObject } from '@/lib/database/shared/utils'

const data = {
  name: 'Equipment',
  description: 'Medical device',
  internal_id: '123',
  temp_field: 'temporary'
}

const publicData = filterObject(data, (key, value) => 
  !key.startsWith('internal_') && !key.startsWith('temp_')
)
// Result: { name: 'Equipment', description: 'Medical device' }
```

## Error Recovery Utilities

### `withRetry<T>(operation, options?): Promise<T>`

Executes an operation with automatic retry on failure.

**Example:**
```typescript
import { withRetry } from '@/lib/database/shared/utils'

const result = await withRetry(
  async () => {
    return await database.equipos.create(equipoData)
  },
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryIf: (error) => error.code === 'CONNECTION_ERROR'
  }
)
```

### `withTimeout<T>(promise, timeoutMs): Promise<T>`

Adds a timeout to any promise.

**Example:**
```typescript
import { withTimeout } from '@/lib/database/shared/utils'

try {
  const result = await withTimeout(
    database.equipos.findAll(),
    5000 // 5 second timeout
  )
} catch (error) {
  if (error.message === 'Operation timed out') {
    console.error('Database query took too long')
  }
}
```

## Best Practices

### Error Handling
```typescript
// Always use structured error creation
const error = createDatabaseError(
  'Clear, descriptive message',
  'SPECIFIC_ERROR_CODE',
  'Technical details for debugging',
  'Helpful hint for resolution'
)
```

### Logging
```typescript
// Use appropriate log levels
logger.info('Normal operations')
logger.warn('Potential issues')
logger.error('Actual problems')
logger.debug('Detailed debugging info')

// Include relevant metadata
logger.info('Operation completed', 'functionName', {
  duration: 150,
  recordsProcessed: 25,
  userId: 'user123'
})
```

### Validation
```typescript
// Define comprehensive validation rules
const rules: ValidationRule[] = [
  { field: 'required_field', required: true },
  { field: 'email_field', type: 'email' },
  { field: 'custom_field', customValidator: customLogic }
]

// Always validate before processing
const validation = validateData(input, rules)
if (!validation.isValid) {
  throw createDatabaseError('Validation failed', 'VALIDATION_ERROR')
}
```

### Performance
```typescript
// Use debouncing for user input
const debouncedHandler = debounce(handler, 300)

// Use throttling for frequent operations
const throttledSave = throttle(saveFunction, 1000)

// Use retry for unreliable operations
const result = await retry(unstableOperation, 3)
```

## Testing Utilities

The module also provides testing utilities:

```typescript
// Mock logger for testing
export const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
})

// Test data generators
export const generateTestData = (type: string, overrides?: any) => {
  // Generate test data based on type
}
```