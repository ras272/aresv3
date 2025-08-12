# Usuarios Module Documentation

## Overview

The Usuarios module handles user management and statistics operations. It provides functionality for tracking user references and generating user-related analytics across the system.

## Interface

```typescript
export interface UsuariosModule extends DatabaseModule {
  getUsuariosReferenciados(): Promise<UsuarioReferenciado[]>
  getEstadisticasUsuarios(): Promise<EstadisticasUsuarios>
}
```

## Functions

### `getUsuariosReferenciados(): Promise<UsuarioReferenciado[]>`

Retrieves all users that are referenced across the system in various operations.

**Returns:** Promise resolving to array of referenced users with their activity summary

**Example:**
```typescript
import { getUsuariosReferenciados } from '@/lib/database/usuarios'

try {
  const usuarios = await getUsuariosReferenciados()
  console.log(`Found ${usuarios.length} referenced users`)
  
  // Show users with most activity
  const topUsers = usuarios
    .sort((a, b) => b.totalActividades - a.totalActividades)
    .slice(0, 5)
    
  console.log('Most active users:', topUsers)
} catch (error) {
  console.error('Error fetching referenced users:', error)
}
```

### `getEstadisticasUsuarios(): Promise<EstadisticasUsuarios>`

Generates comprehensive user statistics and activity metrics.

**Returns:** Promise resolving to user statistics object

**Example:**
```typescript
import { getEstadisticasUsuarios } from '@/lib/database/usuarios'

try {
  const stats = await getEstadisticasUsuarios()
  console.log('User Statistics:')
  console.log(`Total users: ${stats.totalUsuarios}`)
  console.log(`Active users: ${stats.usuariosActivos}`)
  console.log(`Most active user: ${stats.usuarioMasActivo}`)
  console.log(`Activities by type:`, stats.actividadesPorTipo)
} catch (error) {
  console.error('Error fetching user statistics:', error)
}
```

## Types

### `UsuarioReferenciado`

Interface for users referenced in system operations:

```typescript
export interface UsuarioReferenciado {
  usuario: string
  nombre?: string
  email?: string
  totalActividades: number
  ultimaActividad: string
  actividades: {
    mantenimientos: number
    movimientosStock: number
    cargasMercaderia: number
    remisiones: number
    equipos: number
  }
  roles: string[]
  departamentos: string[]
}
```

### `EstadisticasUsuarios`

Interface for comprehensive user statistics:

```typescript
export interface EstadisticasUsuarios {
  totalUsuarios: number
  usuariosActivos: number
  usuariosInactivos: number
  usuarioMasActivo: string
  actividadesPorTipo: {
    mantenimientos: number
    movimientosStock: number
    cargasMercaderia: number
    remisiones: number
    equipos: number
  }
  actividadesPorMes: Array<{
    mes: string
    actividades: number
    usuarios: number
  }>
  distribucionPorRol: Array<{
    rol: string
    usuarios: number
    actividades: number
  }>
  distribucionPorDepartamento: Array<{
    departamento: string
    usuarios: number
    actividades: number
  }>
  tendenciaActividad: Array<{
    fecha: string
    actividades: number
  }>
}
```

## User Activity Tracking

The module tracks user activity across various system operations:

### Maintenance Activities
- Maintenance creation and assignment
- Maintenance execution and completion
- Technician assignments and updates

### Stock Operations
- Stock movements and registrations
- Stock exits and entries
- Inventory adjustments and transfers

### Merchandise Operations
- Merchandise load creation
- Product processing and validation
- Equipment creation from merchandise

### Shipment Operations
- Shipment creation and management
- Delivery confirmations
- Return processing

### Equipment Operations
- Equipment creation and updates
- Component assignments
- Equipment maintenance scheduling

## Error Handling

Common error scenarios in user operations:

```typescript
try {
  const result = await usuariosFunction(params)
  return result
} catch (error) {
  if (error.message.includes('user_not_found')) {
    console.error('❌ User not found in system')
  } else if (error.message.includes('insufficient_permissions')) {
    console.error('❌ User lacks required permissions')
  } else {
    console.error('❌ Error in UsuariosModule.functionName:', error)
    throw error
  }
}
```

## Integration Points

The Usuarios module integrates with:

- **Mantenimientos Module**: Tracks technician assignments and activities
- **Stock Module**: Monitors user stock operations
- **Mercaderias Module**: Records user merchandise activities
- **Remisiones Module**: Tracks shipment handlers
- **Equipos Module**: Monitors equipment operations
- **Authentication System**: Links with user authentication data

## User Roles and Permissions

The system recognizes various user roles:

### Técnico
Technical staff responsible for:
- Equipment maintenance
- Component installations
- Technical inventory management
- Field service operations

### Administrador
Administrative staff handling:
- System configuration
- User management
- Report generation
- Data oversight

### Operador
Operational staff managing:
- Stock operations
- Merchandise processing
- Shipment handling
- Inventory management

### Supervisor
Supervisory staff overseeing:
- Team management
- Quality control
- Process oversight
- Performance monitoring

## Performance Considerations

- User queries are optimized with appropriate indexes
- Activity aggregations are cached for performance
- Large datasets use pagination for better response times
- Statistics are computed incrementally where possible

## Analytics Features

The module provides comprehensive analytics:

1. **Activity Trends**: User activity over time
2. **Performance Metrics**: User productivity measurements
3. **Role Analysis**: Activity distribution by role
4. **Department Insights**: Cross-departmental activity analysis
5. **Usage Patterns**: Peak activity times and patterns

## Reporting Capabilities

### User Activity Report
Detailed breakdown of user activities:
```typescript
const report = {
  usuario: 'juan.perez',
  periodo: '2024-01',
  actividades: {
    mantenimientos: 15,
    movimientosStock: 23,
    equipos: 8
  },
  eficiencia: 92.5,
  tiempoPromedio: 45 // minutes per activity
}
```

### Department Performance Report
Performance metrics by department:
```typescript
const departmentReport = {
  departamento: 'Mantenimiento',
  usuarios: 8,
  actividadesTotales: 156,
  promedioActividades: 19.5,
  eficienciaPromedio: 88.3
}
```

## Best Practices

1. **Track all user activities** for comprehensive analytics
2. **Use consistent user identifiers** across all modules
3. **Maintain user role information** for proper access control
4. **Regular cleanup** of inactive user references
5. **Monitor user performance** for training opportunities
6. **Protect user privacy** in accordance with data protection laws
7. **Audit user activities** for security and compliance

## Testing

The module includes comprehensive tests covering:
- User reference tracking across all modules
- Statistics calculation accuracy
- Performance with large user datasets
- Integration with authentication systems
- Privacy and security compliance

Example test:
```typescript
import { getUsuariosReferenciados, getEstadisticasUsuarios } from '@/lib/database/usuarios'

describe('Usuarios Module', () => {
  test('should track user references correctly', async () => {
    const usuarios = await getUsuariosReferenciados()
    expect(usuarios).toBeInstanceOf(Array)
    
    if (usuarios.length > 0) {
      const usuario = usuarios[0]
      expect(usuario.usuario).toBeDefined()
      expect(usuario.totalActividades).toBeGreaterThanOrEqual(0)
      expect(usuario.actividades).toBeDefined()
    }
  })
  
  test('should generate accurate statistics', async () => {
    const stats = await getEstadisticasUsuarios()
    expect(stats.totalUsuarios).toBeGreaterThanOrEqual(0)
    expect(stats.actividadesPorTipo).toBeDefined()
    expect(stats.distribucionPorRol).toBeInstanceOf(Array)
  })
})
```

## Privacy and Security

The module implements privacy and security measures:

1. **Data Minimization**: Only necessary user data is stored
2. **Access Control**: Role-based access to user information
3. **Audit Logging**: All user data access is logged
4. **Data Retention**: Automatic cleanup of old activity data
5. **Anonymization**: Personal data can be anonymized for analytics

## Migration Considerations

When migrating user data:

1. **Preserve user identifiers** to maintain activity history
2. **Map role changes** accurately during migration
3. **Validate activity counts** after migration
4. **Update references** in all related modules
5. **Test analytics accuracy** post-migration
6. **Maintain audit trails** throughout the process