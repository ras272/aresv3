# Clinicas Module Documentation

## Overview

The Clinicas module handles clinic management operations, providing CRUD functionality for clinic entities. It manages clinic information, locations, and related administrative data.

## Interface

```typescript
export interface ClinicasModule extends DatabaseModule {
  getAllClinicas(): Promise<Clinica[]>
  createClinica(clinicaData: ClinicaInput): Promise<Clinica>
  updateClinica(clinicaId: string, updates: ClinicaUpdate): Promise<void>
  deleteClinica(clinicaId: string): Promise<void>
}
```

## Functions

### `getAllClinicas(): Promise<Clinica[]>`

Retrieves all clinics in the system.

**Returns:** Promise resolving to array of all clinics

**Example:**
```typescript
import { getAllClinicas } from '@/lib/database/clinicas'

try {
  const clinicas = await getAllClinicas()
  console.log(`Found ${clinicas.length} clinics`)
  
  // Group by city
  const byCity = clinicas.reduce((acc, clinica) => {
    acc[clinica.ciudad] = (acc[clinica.ciudad] || 0) + 1
    return acc
  }, {})
  
  console.log('Clinics by city:', byCity)
} catch (error) {
  console.error('Error fetching clinics:', error)
}
```

### `createClinica(clinicaData: ClinicaInput): Promise<Clinica>`

Creates a new clinic record.

**Parameters:**
- `clinicaData`: Clinic data including name, location, and contact information

**Returns:** Promise resolving to the created Clinica

**Example:**
```typescript
import { createClinica } from '@/lib/database/clinicas'

const clinicaData = {
  nombre: 'Hospital Central',
  direccion: 'Av. Principal 123',
  ciudad: 'Bogotá',
  departamento: 'Cundinamarca',
  telefono: '+57 1 234-5678',
  email: 'contacto@hospitalcentral.com',
  tipoClinica: 'Hospital',
  nivel: 'III',
  contactoPrincipal: 'Dr. Juan Pérez',
  cargoContacto: 'Director Médico',
  observaciones: 'Hospital de alta complejidad'
}

try {
  const clinica = await createClinica(clinicaData)
  console.log('Clinic created:', clinica.id)
  console.log('Name:', clinica.nombre)
} catch (error) {
  console.error('Error creating clinic:', error)
}
```

### `updateClinica(clinicaId: string, updates: ClinicaUpdate): Promise<void>`

Updates clinic information.

**Parameters:**
- `clinicaId`: ID of the clinic to update
- `updates`: Object containing fields to update

**Returns:** Promise that resolves when update is complete

**Example:**
```typescript
import { updateClinica } from '@/lib/database/clinicas'

try {
  await updateClinica('clinica-123', {
    telefono: '+57 1 234-9999',
    email: 'nuevo@hospitalcentral.com',
    contactoPrincipal: 'Dra. María García',
    cargoContacto: 'Directora Administrativa',
    observaciones: 'Actualización de contactos - Enero 2024'
  })
  
  console.log('Clinic updated successfully')
} catch (error) {
  console.error('Error updating clinic:', error)
}
```

### `deleteClinica(clinicaId: string): Promise<void>`

Deletes a clinic from the system.

**Parameters:**
- `clinicaId`: ID of the clinic to delete

**Returns:** Promise that resolves when deletion is complete

**Example:**
```typescript
import { deleteClinica } from '@/lib/database/clinicas'

try {
  await deleteClinica('clinica-123')
  console.log('Clinic deleted successfully')
} catch (error) {
  if (error.message.includes('foreign_key_constraint')) {
    console.error('Cannot delete clinic: has associated equipment or maintenance records')
  } else {
    console.error('Error deleting clinic:', error)
  }
}
```

## Types

### `ClinicaInput`

Input interface for creating new clinics:

```typescript
export interface ClinicaInput {
  nombre: string
  direccion: string
  ciudad: string
  departamento: string
  telefono?: string
  email?: string
  tipoClinica: 'Hospital' | 'Clínica' | 'Centro de Salud' | 'IPS' | 'EPS'
  nivel?: 'I' | 'II' | 'III' | 'IV'
  contactoPrincipal?: string
  cargoContacto?: string
  telefonoContacto?: string
  emailContacto?: string
  observaciones?: string
  activa?: boolean
}
```

### `ClinicaUpdate`

Interface for updating clinic records:

```typescript
export interface ClinicaUpdate {
  nombre?: string
  direccion?: string
  ciudad?: string
  departamento?: string
  telefono?: string
  email?: string
  tipoClinica?: 'Hospital' | 'Clínica' | 'Centro de Salud' | 'IPS' | 'EPS'
  nivel?: 'I' | 'II' | 'III' | 'IV'
  contactoPrincipal?: string
  cargoContacto?: string
  telefonoContacto?: string
  emailContacto?: string
  observaciones?: string
  activa?: boolean
}
```

### `Clinica`

Complete clinic record interface:

```typescript
export interface Clinica {
  id: string
  nombre: string
  direccion: string
  ciudad: string
  departamento: string
  telefono?: string
  email?: string
  tipoClinica: string
  nivel?: string
  contactoPrincipal?: string
  cargoContacto?: string
  telefonoContacto?: string
  emailContacto?: string
  observaciones?: string
  activa: boolean
  createdAt: string
  updatedAt: string
  
  // Related data (when included)
  equipos?: Equipo[]
  mantenimientos?: Mantenimiento[]
  remisiones?: Remision[]
}
```

## Clinic Types

### Hospital
Large medical facilities with multiple specialties:
- Level III or IV complexity
- Emergency services
- Surgical capabilities
- Intensive care units

### Clínica
Specialized medical facilities:
- Specific medical specialties
- Outpatient services
- Some surgical procedures
- Level II or III complexity

### Centro de Salud
Primary healthcare facilities:
- Basic medical services
- Preventive care
- Level I complexity
- Community health focus

### IPS (Institución Prestadora de Servicios)
Healthcare service providers:
- Various complexity levels
- Contracted services
- Specialized procedures
- Insurance network providers

### EPS (Entidad Promotora de Salud)
Health insurance entities:
- Healthcare plan management
- Provider network coordination
- Administrative functions
- Member services

## Error Handling

Common error scenarios in clinic operations:

```typescript
try {
  const result = await clinicasFunction(params)
  return result
} catch (error) {
  if (error.message.includes('duplicate_name')) {
    console.error('❌ Clinic with this name already exists')
  } else if (error.message.includes('invalid_email')) {
    console.error('❌ Invalid email format')
  } else if (error.message.includes('foreign_key_constraint')) {
    console.error('❌ Cannot delete clinic: has associated records')
  } else {
    console.error('❌ Error in ClinicasModule.functionName:', error)
    throw error
  }
}
```

## Integration Points

The Clinicas module integrates with:

- **Equipos Module**: Clinics have associated equipment
- **Mantenimientos Module**: Maintenance is performed at clinic locations
- **Remisiones Module**: Shipments are sent to clinics
- **Supabase Tables**:
  - `clinicas`
  - `equipos` (foreign key relationship)
  - `mantenimientos` (location reference)
  - `remisiones` (destination reference)

## Validation Rules

The module enforces the following validation rules:

1. **Required Fields**: nombre, direccion, ciudad, departamento
2. **Email Format**: Valid email format when provided
3. **Phone Format**: Valid phone number format when provided
4. **Unique Names**: Clinic names must be unique within the same city
5. **Active Status**: Only active clinics can receive new equipment

## Geographic Organization

Clinics are organized geographically:

```typescript
// Example of geographic grouping
const clinicasByRegion = {
  'Bogotá': ['Hospital Central', 'Clínica del Norte'],
  'Medellín': ['Hospital San Vicente', 'Clínica Las Vegas'],
  'Cali': ['Hospital Universitario', 'Clínica Imbanaco']
}
```

## Performance Considerations

- Clinic queries are indexed by city and department
- Active status filtering is optimized for frequent queries
- Related data (equipment, maintenance) is loaded on demand
- Bulk operations are supported for multiple clinic updates

## Reporting Features

The module supports various clinic reports:

1. **Clinic Directory**: Complete list with contact information
2. **Geographic Distribution**: Clinics by region and city
3. **Equipment Summary**: Equipment count per clinic
4. **Maintenance Activity**: Maintenance frequency by clinic
5. **Service Coverage**: Coverage analysis by geographic area

## Best Practices

1. **Maintain accurate contact information** for effective communication
2. **Use consistent naming conventions** for easy identification
3. **Keep geographic data current** for proper service delivery
4. **Validate contact information** before creating records
5. **Use appropriate clinic types** for proper categorization
6. **Regular data cleanup** to remove inactive clinics
7. **Document special requirements** in observations field

## Testing

The module includes comprehensive tests covering:
- Clinic CRUD operations with various data combinations
- Validation scenarios for required and optional fields
- Integration with related modules (equipos, mantenimientos)
- Error handling for constraint violations
- Performance tests for large clinic datasets

Example test:
```typescript
import { createClinica, updateClinica, deleteClinica } from '@/lib/database/clinicas'

describe('Clinicas Module', () => {
  test('should create, update, and delete clinic', async () => {
    const clinicaData = {
      nombre: 'Test Hospital',
      direccion: 'Test Address 123',
      ciudad: 'Test City',
      departamento: 'Test Department',
      tipoClinica: 'Hospital'
    }
    
    const clinica = await createClinica(clinicaData)
    expect(clinica.id).toBeDefined()
    expect(clinica.nombre).toBe('Test Hospital')
    
    await updateClinica(clinica.id, {
      telefono: '+57 1 123-4567'
    })
    
    await deleteClinica(clinica.id)
  })
})
```

## Data Migration

When migrating existing clinic data:

1. **Validate all required fields** are present
2. **Standardize geographic names** (cities, departments)
3. **Clean up contact information** formats
4. **Merge duplicate entries** carefully
5. **Preserve historical relationships** with equipment and maintenance
6. **Update references** in related tables