# Database Module Troubleshooting Guide

## Common Issues and Solutions

### Import and Module Issues

#### Issue: Module Not Found Error
```
Error: Cannot resolve module '@/lib/database/equipos'
```

**Possible Causes:**
- Incorrect module path
- TypeScript path mapping not configured
- Module doesn't exist

**Solutions:**
1. **Check the module path:**
   ```typescript
   // Correct paths
   import { createEquipo } from '@/lib/database/equipos'
   import { getAllStockItems } from '@/lib/database/stock'
   import { createMantenimiento } from '@/lib/database/mantenimientos'
   ```

2. **Verify TypeScript configuration:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"]
       }
     }
   }
   ```

3. **Check if the module file exists:**
   ```bash
   ls -la src/lib/database/
   # Should show: equipos.ts, stock.ts, mantenimientos.ts, etc.
   ```

#### Issue: Function Not Exported Error
```
Error: 'createEquipo' is not exported from '@/lib/database/equipos'
```

**Solutions:**
1. **Check the function name:**
   ```typescript
   // Make sure you're using the correct function name
   import { createEquipo } from '@/lib/database/equipos' // ✅ Correct
   import { createEquipment } from '@/lib/database/equipos' // ❌ Wrong name
   ```

2. **Verify the export in the module:**
   ```typescript
   // In equipos.ts, make sure the function is exported
   export async function createEquipo(equipoData: EquipoInput): Promise<Equipo> {
     // Implementation
   }
   ```

3. **Check the main index.ts file:**
   ```typescript
   // In index.ts, verify re-export
   export { createEquipo } from './equipos'
   ```

#### Issue: Circular Dependency Error
```
Error: Circular dependency detected
```

**Solutions:**
1. **Identify the circular dependency:**
   ```bash
   # Use a tool like madge to detect circular dependencies
   npx madge --circular src/lib/database/
   ```

2. **Refactor to remove circular dependencies:**
   ```typescript
   // Bad: equipos.ts imports from stock.ts, stock.ts imports from equipos.ts
   
   // Good: Create a shared module for common functionality
   // shared/common.ts
   export function commonFunction() { /* ... */ }
   
   // equipos.ts
   import { commonFunction } from './shared/common'
   
   // stock.ts
   import { commonFunction } from './shared/common'
   ```

### Runtime Errors

#### Issue: Function is Not a Function Error
```
TypeError: createEquipo is not a function
```

**Possible Causes:**
- Incorrect import statement
- Function not properly exported
- Circular dependency

**Solutions:**
1. **Check import statement:**
   ```typescript
   // Make sure you're importing correctly
   import { createEquipo } from '@/lib/database/equipos'
   
   // Not as default import
   import createEquipo from '@/lib/database/equipos' // ❌ Wrong
   ```

2. **Verify the function exists:**
   ```typescript
   // Add debugging to check what's imported
   import * as equipos from '@/lib/database/equipos'
   console.log('Available functions:', Object.keys(equipos))
   ```

3. **Check for async/await issues:**
   ```typescript
   // Make sure you're awaiting async functions
   const equipo = await createEquipo(equipoData) // ✅ Correct
   const equipo = createEquipo(equipoData) // ❌ Missing await
   ```

#### Issue: Database Connection Errors
```
Error: Failed to connect to database
```

**Solutions:**
1. **Check Supabase configuration:**
   ```typescript
   // Verify environment variables
   console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
   ```

2. **Test database connectivity:**
   ```typescript
   import { supabase } from '@/lib/database/shared/supabase'
   
   async function testConnection() {
     try {
       const { data, error } = await supabase.from('clinicas').select('count').limit(1)
       if (error) throw error
       console.log('Database connection successful')
     } catch (error) {
       console.error('Database connection failed:', error)
     }
   }
   ```

3. **Check network connectivity:**
   ```bash
   # Test if you can reach Supabase
   curl -I https://your-project.supabase.co
   ```

### Performance Issues

#### Issue: Slow Query Performance
```
Warning: Query took 5000ms to complete
```

**Solutions:**
1. **Add query limits:**
   ```typescript
   // Bad: No limit
   const equipos = await getAllEquipos()
   
   // Good: With reasonable limit
   const equipos = await getAllEquipos()
   const limitedEquipos = equipos.slice(0, 100)
   ```

2. **Use specific field selection:**
   ```typescript
   // Bad: Select all fields
   const { data } = await supabase.from('equipos').select('*')
   
   // Good: Select only needed fields
   const { data } = await supabase.from('equipos').select('id, nombre, estado')
   ```

3. **Implement caching:**
   ```typescript
   import { createCache } from '@/lib/database/shared/performance'
   
   const equiposCache = createCache({ ttl: 300000 }) // 5 minutes
   
   async function getCachedEquipos() {
     const cached = equiposCache.get('all_equipos')
     if (cached) return cached
     
     const equipos = await getAllEquipos()
     equiposCache.set('all_equipos', equipos)
     return equipos
   }
   ```

#### Issue: Memory Leaks
```
Warning: Memory usage increasing over time
```

**Solutions:**
1. **Monitor memory usage:**
   ```typescript
   import { monitorMemoryLeaks } from '@/lib/database/shared/performance'
   
   const monitor = monitorMemoryLeaks()
   setInterval(() => {
     const leaks = monitor.checkForLeaks()
     if (leaks.length > 0) {
       console.warn('Memory leaks detected:', leaks)
     }
   }, 60000)
   ```

2. **Clean up resources:**
   ```typescript
   // Make sure to clean up large objects
   async function processLargeDataset(data: any[]) {
     let processedData = []
     
     try {
       processedData = await processData(data)
       return processedData
     } finally {
       // Clean up
       processedData = null
       if (global.gc) global.gc() // Force garbage collection in development
     }
   }
   ```

### Validation and Data Issues

#### Issue: Validation Errors
```
Error: Validation failed: nombre is required
```

**Solutions:**
1. **Check validation rules:**
   ```typescript
   import { validateData } from '@/lib/database/shared/utils'
   
   const rules = [
     { field: 'nombre', required: true, type: 'string', minLength: 1 },
     { field: 'cliente', required: true, type: 'string', minLength: 1 }
   ]
   
   const result = validateData(equipoData, rules)
   if (!result.isValid) {
     console.error('Validation errors:', result.errors)
     // Handle each error appropriately
   }
   ```

2. **Debug input data:**
   ```typescript
   // Log the actual data being validated
   console.log('Input data:', JSON.stringify(equipoData, null, 2))
   console.log('Validation rules:', rules)
   ```

3. **Handle validation gracefully:**
   ```typescript
   async function createEquipoSafely(equipoData: EquipoInput) {
     try {
       const validation = validateData(equipoData, equipoValidationRules)
       if (!validation.isValid) {
         return {
           success: false,
           errors: validation.errors.map(e => `${e.field}: ${e.message}`)
         }
       }
       
       const equipo = await createEquipo(equipoData)
       return { success: true, data: equipo }
     } catch (error) {
       return { success: false, error: error.message }
     }
   }
   ```

#### Issue: Data Type Mismatches
```
Error: Expected string but received number
```

**Solutions:**
1. **Use proper TypeScript types:**
   ```typescript
   // Define clear interfaces
   interface EquipoInput {
     nombre: string
     cliente: string
     numeroSerie: string
     fechaEntrega: string // ISO date string
     costo?: number
   }
   
   // Use the interface
   async function createEquipo(equipoData: EquipoInput): Promise<Equipo> {
     // TypeScript will catch type mismatches at compile time
   }
   ```

2. **Add runtime type checking:**
   ```typescript
   function ensureString(value: any, fieldName: string): string {
     if (typeof value !== 'string') {
       throw new Error(`${fieldName} must be a string, got ${typeof value}`)
     }
     return value
   }
   
   function ensureNumber(value: any, fieldName: string): number {
     const num = Number(value)
     if (isNaN(num)) {
       throw new Error(`${fieldName} must be a number, got ${typeof value}`)
     }
     return num
   }
   ```

### Testing Issues

#### Issue: Tests Failing After Migration
```
Error: Cannot find module '@/lib/database' in test files
```

**Solutions:**
1. **Update test imports:**
   ```typescript
   // Before
   import { createEquipo } from '@/lib/database'
   
   // After
   import { createEquipo } from '@/lib/database/equipos'
   ```

2. **Update Jest configuration:**
   ```json
   // jest.config.js
   {
     "moduleNameMapping": {
       "^@/(.*)$": "<rootDir>/src/$1"
     }
   }
   ```

3. **Mock the correct modules:**
   ```typescript
   // Mock specific modules instead of the main database module
   jest.mock('@/lib/database/equipos', () => ({
     createEquipo: jest.fn(),
     getAllEquipos: jest.fn()
   }))
   ```

#### Issue: Supabase Mocking Issues
```
Error: supabase.from is not a function in tests
```

**Solutions:**
1. **Create proper Supabase mocks:**
   ```typescript
   // __mocks__/@supabase/supabase-js.ts
   export const createClient = jest.fn(() => ({
     from: jest.fn(() => ({
       select: jest.fn().mockReturnThis(),
       insert: jest.fn().mockReturnThis(),
       update: jest.fn().mockReturnThis(),
       delete: jest.fn().mockReturnThis(),
       eq: jest.fn().mockReturnThis(),
       single: jest.fn().mockResolvedValue({ data: {}, error: null })
     }))
   }))
   ```

2. **Use test utilities:**
   ```typescript
   // test-utils/database.ts
   export function createMockSupabaseClient() {
     return {
       from: jest.fn(() => ({
         select: jest.fn().mockReturnThis(),
         insert: jest.fn().mockResolvedValue({ data: mockData, error: null }),
         // ... other methods
       }))
     }
   }
   ```

### Deployment Issues

#### Issue: Environment Variables Not Found
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**Solutions:**
1. **Check environment file:**
   ```bash
   # Make sure .env.local exists and has the correct variables
   cat .env.local
   ```

2. **Verify variable names:**
   ```env
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Check deployment environment:**
   ```bash
   # For Vercel
   vercel env ls
   
   # For other platforms, check their environment variable settings
   ```

#### Issue: Build Errors
```
Error: Module not found during build
```

**Solutions:**
1. **Check build configuration:**
   ```json
   // next.config.js
   module.exports = {
     experimental: {
       esmExternals: false
     }
   }
   ```

2. **Verify all imports are correct:**
   ```bash
   # Run TypeScript compiler to check for errors
   npx tsc --noEmit
   ```

3. **Check for dynamic imports:**
   ```typescript
   // Make sure dynamic imports are handled correctly
   const module = await import('@/lib/database/equipos')
   ```

## Debugging Tools and Techniques

### 1. Enable Debug Logging

```typescript
// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  import('@/lib/database/shared/utils').then(({ createLogger }) => {
    const logger = createLogger('Debug')
    logger.debug('Database module loaded', 'init', {
      timestamp: new Date().toISOString()
    })
  })
}
```

### 2. Use Performance Monitoring

```typescript
import { performanceMonitor } from '@/lib/database/shared/performance'

// Monitor specific operations
const monitor = performanceMonitor.start('troubleshoot-operation')
try {
  const result = await problematicFunction()
  monitor.success({ result })
} catch (error) {
  monitor.error(error)
  throw error
}
```

### 3. Database Query Debugging

```typescript
// Add query logging
const originalFrom = supabase.from
supabase.from = function(table: string) {
  console.log(`Querying table: ${table}`)
  return originalFrom.call(this, table)
}
```

### 4. Memory Usage Monitoring

```typescript
// Monitor memory usage
function logMemoryUsage(label: string) {
  const usage = process.memoryUsage()
  console.log(`${label} - Memory Usage:`, {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`
  })
}
```

## Getting Help

### 1. Check Documentation
- [Module Documentation](./README.md)
- [Migration Guide](./MIGRATION.md)
- [Best Practices](./BEST_PRACTICES.md)

### 2. Review Test Files
Look at existing test files for usage examples:
```bash
find src/lib/database/__tests__ -name "*.test.ts" -exec grep -l "createEquipo" {} \;
```

### 3. Enable Verbose Logging
```typescript
// Temporarily enable verbose logging
process.env.DEBUG = 'database:*'
```

### 4. Use Browser DevTools
- Check Network tab for failed requests
- Check Console for error messages
- Use Performance tab to identify bottlenecks

### 5. Database Inspection
```typescript
// Inspect database state
async function inspectDatabase() {
  const tables = ['equipos', 'mantenimientos', 'stock_items', 'clinicas']
  
  for (const table of tables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      console.log(`${table}: ${count} records`)
    } catch (error) {
      console.error(`Error inspecting ${table}:`, error.message)
    }
  }
}
```

## Reporting Issues

When reporting issues, please include:

1. **Error Message**: Full error message and stack trace
2. **Code Sample**: Minimal code that reproduces the issue
3. **Environment**: Node.js version, Next.js version, browser
4. **Steps to Reproduce**: Clear steps to reproduce the issue
5. **Expected Behavior**: What you expected to happen
6. **Actual Behavior**: What actually happened

### Issue Template

```markdown
## Issue Description
Brief description of the issue

## Error Message
```
Full error message and stack trace
```

## Code Sample
```typescript
// Minimal code that reproduces the issue
```

## Environment
- Node.js version: 
- Next.js version: 
- Browser: 
- Operating System: 

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Additional Context
Any additional information that might be helpful
```

## Prevention Strategies

### 1. Use TypeScript Strictly
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2. Set Up Linting
```json
// .eslintrc.js
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error"
  }
}
```

### 3. Use Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### 4. Regular Health Checks
```typescript
// Set up regular health checks
setInterval(async () => {
  try {
    await checkDatabaseHealth()
    console.log('Database health check passed')
  } catch (error) {
    console.error('Database health check failed:', error)
    // Send alert or notification
  }
}, 300000) // Every 5 minutes
```