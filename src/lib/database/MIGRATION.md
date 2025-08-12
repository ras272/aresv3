# Database Module Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from the old monolithic database.ts structure to the new modular architecture. The migration is designed to be gradual and non-breaking, allowing teams to adopt the new structure at their own pace.

## Migration Timeline

### Phase 1: Immediate (No Changes Required)
- ✅ All existing imports continue to work
- ✅ All function signatures remain identical
- ✅ No breaking changes introduced

### Phase 2: Gradual Adoption (Recommended)
- 🔄 Start using new import patterns for new code
- 🔄 Gradually update existing imports when modifying files
- 🔄 Take advantage of improved IDE support

### Phase 3: Full Migration (Optional)
- 🎯 Update all imports to use new modular structure
- 🎯 Remove deprecated import patterns
- 🎯 Optimize bundle size through tree-shaking

## Import Pattern Migration

### Current (Old) Pattern - Still Works
```typescript
// All existing imports continue to work unchanged
import { 
  createCargaMercaderia,
  getAllCargas,
  getAllStockItems,
  registrarMovimientoStock,
  createEquipo,
  getAllEquipos,
  createMantenimiento,
  getAllMantenimientos,
  getAllClinicas,
  createClinica,
  getAllRemisiones,
  createRemision
} from '@/lib/database'
```

### New (Recommended) Pattern
```typescript
// Import from specific modules for better organization
import { createCargaMercaderia, getAllCargas } from '@/lib/database/mercaderias'
import { getAllStockItems, registrarMovimientoStock } from '@/lib/database/stock'
import { createEquipo, getAllEquipos } from '@/lib/database/equipos'
import { createMantenimiento, getAllMantenimientos } from '@/lib/database/mantenimientos'
import { getAllClinicas, createClinica } from '@/lib/database/clinicas'
import { getAllRemisiones, createRemision } from '@/lib/database/remisiones'
```

### Mixed Pattern (Transitional)
```typescript
// You can mix old and new patterns during transition
import { createCargaMercaderia } from '@/lib/database' // Old pattern
import { getAllStockItems } from '@/lib/database/stock' // New pattern
```

## Step-by-Step Migration

### Step 1: Identify Current Usage

First, identify all files that import from the database module:

```bash
# Search for database imports in your codebase
grep -r "from '@/lib/database'" src/
grep -r "import.*database" src/
```

### Step 2: Categorize Functions by Module

Group your current imports by their new module locations:

#### Mercaderias Module Functions
```typescript
// Functions that moved to mercaderias module
createCargaMercaderia
getCargaCompleta
getAllCargas
generateCodigoCarga
deleteCargaMercaderia
createOrUpdateStockFromProduct
createOrUpdateStockFromSubitem
```

#### Stock Module Functions
```typescript
// Functions that moved to stock module
getAllStockItems
updateStockItemDetails
updateComponenteDisponibleDetails
registrarMovimientoStock
getAllMovimientosStock
getMovimientosByProducto
getMovimientosByCarpeta
getEstadisticasTrazabilidad
registrarSalidaStock
registrarSalidaStockReporte
devolverRepuestosAlStockReporte
getAllTransaccionesStock
createTransaccionStock
procesarSalidaStock
```

#### Equipos Module Functions
```typescript
// Functions that moved to equipos module
createEquipo
createEquipoFromMercaderia
getAllEquipos
deleteEquipo
getAllComponentesDisponibles
asignarComponenteAEquipo
getHistorialAsignaciones
updateComponente
createComponenteInventarioTecnico
createComponenteInventarioTecnicoReparacion
createComponenteInventarioTecnicoFromSubitem
```

#### Mantenimientos Module Functions
```typescript
// Functions that moved to mantenimientos module
createMantenimiento
getAllMantenimientos
updateMantenimiento
deleteMantenimiento
```

#### Clinicas Module Functions
```typescript
// Functions that moved to clinicas module
getAllClinicas
createClinica
updateClinica
deleteClinica
```

#### Remisiones Module Functions
```typescript
// Functions that moved to remisiones module
getAllRemisiones
createRemision
updateRemision
deleteRemision
deleteRemisionConRestauracion
generateNumeroRemision
reducirStockPorRemision
```

#### Usuarios Module Functions
```typescript
// Functions that moved to usuarios module
getUsuariosReferenciados
getEstadisticasUsuarios
```

### Step 3: Update Imports Gradually

#### Example: Migrating a Component

**Before (Old Pattern):**
```typescript
// components/EquipmentManager.tsx
import { 
  createEquipo,
  getAllEquipos,
  deleteEquipo,
  getAllComponentesDisponibles,
  asignarComponenteAEquipo,
  createMantenimiento,
  getAllMantenimientos
} from '@/lib/database'

export function EquipmentManager() {
  // Component implementation using the imported functions
  const handleCreateEquipo = async (data) => {
    const equipo = await createEquipo(data)
    // ... rest of the logic
  }
}
```

**After (New Pattern):**
```typescript
// components/EquipmentManager.tsx
import { 
  createEquipo,
  getAllEquipos,
  deleteEquipo,
  getAllComponentesDisponibles,
  asignarComponenteAEquipo
} from '@/lib/database/equipos'
import { 
  createMantenimiento,
  getAllMantenimientos
} from '@/lib/database/mantenimientos'

export function EquipmentManager() {
  // Component implementation remains exactly the same
  const handleCreateEquipo = async (data) => {
    const equipo = await createEquipo(data)
    // ... rest of the logic
  }
}
```

### Step 4: Update Import Statements

Use this search and replace pattern to update imports:

#### Find and Replace Patterns

**Pattern 1: Single Module Migration**
```typescript
// Find:
import { createEquipo, getAllEquipos, deleteEquipo } from '@/lib/database'

// Replace with:
import { createEquipo, getAllEquipos, deleteEquipo } from '@/lib/database/equipos'
```

**Pattern 2: Multi-Module Migration**
```typescript
// Find:
import { 
  createEquipo,
  getAllEquipos,
  createMantenimiento,
  getAllMantenimientos
} from '@/lib/database'

// Replace with:
import { createEquipo, getAllEquipos } from '@/lib/database/equipos'
import { createMantenimiento, getAllMantenimientos } from '@/lib/database/mantenimientos'
```

### Step 5: Verify Migration

After updating imports, verify everything still works:

```bash
# Run TypeScript compiler to check for errors
npm run type-check

# Run tests to ensure functionality is preserved
npm run test

# Run the application to verify runtime behavior
npm run dev
```

## Migration Tools and Scripts

### Automated Migration Script

Create a migration script to help with the transition:

```javascript
// scripts/migrate-database-imports.js
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const moduleMapping = {
  // Mercaderias functions
  'createCargaMercaderia': 'mercaderias',
  'getAllCargas': 'mercaderias',
  'generateCodigoCarga': 'mercaderias',
  
  // Stock functions
  'getAllStockItems': 'stock',
  'registrarMovimientoStock': 'stock',
  'getAllMovimientosStock': 'stock',
  
  // Equipos functions
  'createEquipo': 'equipos',
  'getAllEquipos': 'equipos',
  'deleteEquipo': 'equipos',
  
  // Add more mappings as needed...
}

function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Extract current imports from @/lib/database
  const importRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/lib\/database['"]/g
  const matches = [...content.matchAll(importRegex)]
  
  if (matches.length === 0) return false
  
  let newContent = content
  
  matches.forEach(match => {
    const importedFunctions = match[1]
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0)
    
    // Group functions by module
    const moduleGroups = {}
    importedFunctions.forEach(func => {
      const module = moduleMapping[func] || 'unknown'
      if (!moduleGroups[module]) moduleGroups[module] = []
      moduleGroups[module].push(func)
    })
    
    // Generate new import statements
    const newImports = Object.entries(moduleGroups)
      .filter(([module]) => module !== 'unknown')
      .map(([module, functions]) => 
        `import { ${functions.join(', ')} } from '@/lib/database/${module}'`
      )
      .join('\n')
    
    // Replace old import with new imports
    newContent = newContent.replace(match[0], newImports)
  })
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent)
    return true
  }
  
  return false
}

// Run migration on all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}')
let migratedCount = 0

files.forEach(file => {
  if (migrateFile(file)) {
    console.log(`Migrated: ${file}`)
    migratedCount++
  }
})

console.log(`Migration complete. Updated ${migratedCount} files.`)
```

### Usage:
```bash
node scripts/migrate-database-imports.js
```

## Best Practices for New Development

### 1. Use Specific Module Imports

**✅ Good:**
```typescript
import { createEquipo } from '@/lib/database/equipos'
import { registrarMovimientoStock } from '@/lib/database/stock'
```

**❌ Avoid:**
```typescript
import { createEquipo, registrarMovimientoStock } from '@/lib/database'
```

### 2. Group Related Imports

**✅ Good:**
```typescript
// Group imports by module
import { createEquipo, getAllEquipos, deleteEquipo } from '@/lib/database/equipos'
import { createMantenimiento, updateMantenimiento } from '@/lib/database/mantenimientos'
```

**❌ Avoid:**
```typescript
// Scattered imports
import { createEquipo } from '@/lib/database/equipos'
import { createMantenimiento } from '@/lib/database/mantenimientos'
import { getAllEquipos } from '@/lib/database/equipos'
```

### 3. Use Type Imports When Appropriate

**✅ Good:**
```typescript
import { createEquipo } from '@/lib/database/equipos'
import type { Equipo, EquipoInput } from '@/lib/database/shared/types'
```

### 4. Leverage Tree Shaking

The new modular structure enables better tree shaking:

```typescript
// This will only include the specific functions you use
import { createEquipo } from '@/lib/database/equipos'
// Instead of importing the entire database module
```

### 5. Use Module-Specific Error Handling

```typescript
import { createEquipo } from '@/lib/database/equipos'
import { createDatabaseError } from '@/lib/database/shared/utils'

try {
  const equipo = await createEquipo(equipoData)
} catch (error) {
  if (error.code === 'DUPLICATE_SERIAL') {
    // Handle equipment-specific error
  } else {
    throw createDatabaseError('Equipment creation failed', 'CREATION_ERROR')
  }
}
```

## Performance Benefits

### Bundle Size Reduction

The new modular structure enables better tree shaking:

```typescript
// Old approach - imports entire database module
import { createEquipo } from '@/lib/database' // ~500KB

// New approach - imports only needed module
import { createEquipo } from '@/lib/database/equipos' // ~50KB
```

### Improved Development Experience

- **Better IDE Support**: More accurate IntelliSense and auto-completion
- **Faster Compilation**: Smaller modules compile faster
- **Clearer Dependencies**: Easier to understand what each component uses

### Runtime Performance

- **Lazy Loading**: Modules can be loaded on demand
- **Reduced Memory Usage**: Only loaded modules consume memory
- **Better Caching**: Smaller modules cache more effectively

## Troubleshooting Common Issues

### Issue 1: Import Not Found

**Error:**
```
Module '"@/lib/database/equipos"' has no exported member 'createEquipo'
```

**Solution:**
Check the function name and module mapping. The function might be in a different module:

```typescript
// Check the main index.ts file for the correct export location
import { createEquipo } from '@/lib/database/equipos' // ✅ Correct
// or
import { createEquipo } from '@/lib/database' // ✅ Also works (backward compatibility)
```

### Issue 2: TypeScript Errors After Migration

**Error:**
```
Cannot find module '@/lib/database/equipos' or its corresponding type declarations
```

**Solution:**
Ensure TypeScript can resolve the new module paths:

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

### Issue 3: Runtime Errors

**Error:**
```
TypeError: createEquipo is not a function
```

**Solution:**
Verify the import statement and check for circular dependencies:

```typescript
// Make sure you're importing from the correct module
import { createEquipo } from '@/lib/database/equipos'

// Check for circular dependencies in your modules
```

### Issue 4: Performance Regression

**Symptoms:**
- Slower page loads
- Increased bundle size

**Solution:**
Ensure you're using specific imports, not wildcard imports:

```typescript
// ✅ Good - specific imports
import { createEquipo } from '@/lib/database/equipos'

// ❌ Bad - wildcard imports
import * as equipos from '@/lib/database/equipos'
```

## Testing Migration

### Unit Tests

Update your test imports:

```typescript
// Before
import { createEquipo } from '@/lib/database'

// After
import { createEquipo } from '@/lib/database/equipos'

describe('Equipment Management', () => {
  test('should create equipment', async () => {
    const equipo = await createEquipo(mockEquipoData)
    expect(equipo.id).toBeDefined()
  })
})
```

### Integration Tests

Test that the migration doesn't break existing functionality:

```typescript
// Test both old and new import patterns work
describe('Database Migration Compatibility', () => {
  test('old import pattern still works', async () => {
    const { createEquipo } = await import('@/lib/database')
    const equipo = await createEquipo(mockEquipoData)
    expect(equipo.id).toBeDefined()
  })
  
  test('new import pattern works', async () => {
    const { createEquipo } = await import('@/lib/database/equipos')
    const equipo = await createEquipo(mockEquipoData)
    expect(equipo.id).toBeDefined()
  })
})
```

## Migration Checklist

### Pre-Migration
- [ ] Backup your codebase
- [ ] Run all existing tests to establish baseline
- [ ] Document current import patterns
- [ ] Identify all files that import from database module

### During Migration
- [ ] Update imports file by file
- [ ] Test each file after updating imports
- [ ] Run TypeScript compiler after each change
- [ ] Verify functionality in development environment

### Post-Migration
- [ ] Run full test suite
- [ ] Test application in staging environment
- [ ] Monitor bundle size changes
- [ ] Update team documentation
- [ ] Train team on new import patterns

## Team Adoption Strategy

### Phase 1: Education (Week 1)
- Share this migration guide with the team
- Conduct training session on new module structure
- Set up development environment with new structure

### Phase 2: New Code (Weeks 2-4)
- Use new import patterns for all new code
- Update code review guidelines
- Create linting rules to encourage new patterns

### Phase 3: Gradual Migration (Weeks 5-8)
- Update existing files when making changes
- Run migration script on low-risk files
- Monitor for any issues or regressions

### Phase 4: Complete Migration (Weeks 9-12)
- Migrate remaining files
- Remove deprecated patterns
- Optimize bundle configuration

## Support and Resources

### Documentation
- [Module Documentation](./README.md)
- [API Reference](./docs/)
- [Performance Guide](./docs/shared-performance.md)

### Getting Help
- Check the troubleshooting section above
- Review existing tests for usage examples
- Ask team members who have already migrated

### Reporting Issues
If you encounter issues during migration:
1. Document the specific error message
2. Note the file and line where the error occurs
3. Include the import statement that's causing issues
4. Check if the issue exists with the old import pattern

## Future Considerations

### Deprecation Timeline
- **Current**: Both old and new patterns supported
- **6 months**: New pattern recommended, old pattern deprecated
- **12 months**: Old pattern removed (breaking change)

### Upcoming Features
- Enhanced performance monitoring
- Automatic import optimization
- Advanced caching strategies
- Real-time performance metrics

### Migration to Other Patterns
This modular structure also prepares for future migrations to:
- Micro-services architecture
- Different database systems
- Advanced caching layers
- Real-time data synchronization