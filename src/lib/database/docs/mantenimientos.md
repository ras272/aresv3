# Mantenimientos Module Documentation

## Overview

The Mantenimientos module handles maintenance operations and tracking for medical equipment. It manages the complete maintenance lifecycle from scheduling and execution to completion and reporting.

## Interface

```typescript
export interface MantenimientosModule extends DatabaseModule {
  createMantenimiento(
    mantenimientoData: MantenimientoInput
  ): Promise<Mantenimiento>;
  getAllMantenimientos(): Promise<Mantenimiento[]>;
  updateMantenimiento(
    mantenimientoId: string,
    updates: MantenimientoUpdate
  ): Promise<void>;
  deleteMantenimiento(mantenimientoId: string): Promise<void>;
}
```

## Functions

### `createMantenimiento(mantenimientoData: MantenimientoInput): Promise<Mantenimiento>`

Creates a new maintenance record for equipment.

**Parameters:**

- `mantenimientoData`: Maintenance data including equipment, type, and scheduling information

**Returns:** Promise resolving to the created Mantenimiento

**Example:**

```typescript
import { createMantenimiento } from "@/lib/database/mantenimientos";

const mantenimientoData = {
  equipoId: "equipo-123",
  tipoMantenimiento: "Preventivo",
  descripcion: "Mantenimiento preventivo trimestral",
  fechaProgramada: "2024-02-15",
  tecnicoAsignado: "carlos.rodriguez",
  prioridad: "Media",
  observaciones: "Incluir calibración de sensores",
  repuestosNecesarios: [
    {
      nombre: "Filtro HEPA",
      cantidad: 2,
      observaciones: "Reemplazo programado",
    },
  ],
};

try {
  const mantenimiento = await createMantenimiento(mantenimientoData);
  console.log("Maintenance created:", mantenimiento.id);
  console.log("Scheduled for:", mantenimiento.fechaProgramada);
} catch (error) {
  console.error("Error creating maintenance:", error);
}
```

### `getAllMantenimientos(): Promise<Mantenimiento[]>`

Retrieves all maintenance records in the system.

**Returns:** Promise resolving to array of all maintenance records

**Example:**

```typescript
import { getAllMantenimientos } from "@/lib/database/mantenimientos";

try {
  const mantenimientos = await getAllMantenimientos();
  console.log(`Total maintenance records: ${mantenimientos.length}`);

  // Filter by status
  const pending = mantenimientos.filter((m) => m.estado === "Programado");
  const completed = mantenimientos.filter((m) => m.estado === "Completado");

  console.log(`Pending: ${pending.length}, Completed: ${completed.length}`);
} catch (error) {
  console.error("Error fetching maintenance records:", error);
}
```

### `updateMantenimiento(mantenimientoId: string, updates: MantenimientoUpdate): Promise<void>`

Updates maintenance details such as status, results, or scheduling.

**Parameters:**

- `mantenimientoId`: ID of the maintenance record to update
- `updates`: Object containing fields to update

**Returns:** Promise that resolves when update is complete

**Example:**

```typescript
import { updateMantenimiento } from "@/lib/database/mantenimientos";

try {
  await updateMantenimiento("mant-123", {
    estado: "En Progreso",
    fechaInicio: "2024-02-15T09:00:00Z",
    observacionesEjecucion: "Iniciado mantenimiento preventivo",
    tecnicoEjecutor: "carlos.rodriguez",
  });

  console.log("Maintenance updated successfully");
} catch (error) {
  console.error("Error updating maintenance:", error);
}
```

### `deleteMantenimiento(mantenimientoId: string): Promise<void>`

Deletes a maintenance record from the system.

**Parameters:**

- `mantenimientoId`: ID of the maintenance record to delete

**Returns:** Promise that resolves when deletion is complete

**Example:**

```typescript
import { deleteMantenimiento } from "@/lib/database/mantenimientos";

try {
  await deleteMantenimiento("mant-123");
  console.log("Maintenance record deleted successfully");
} catch (error) {
  console.error("Error deleting maintenance:", error);
}
```

## Types

### `MantenimientoInput`

Input interface for creating new maintenance records:

```typescript
export interface MantenimientoInput {
  equipoId: string;
  tipoMantenimiento: "Preventivo" | "Correctivo" | "Predictivo" | "Emergencia";
  descripcion: string;
  fechaProgramada: string;
  tecnicoAsignado?: string;
  prioridad: "Baja" | "Media" | "Alta" | "Crítica";
  observaciones?: string;
  repuestosNecesarios?: Array<{
    nombre: string;
    cantidad: number;
    observaciones?: string;
  }>;
  tiempoEstimado?: number; // in hours
  costoEstimado?: number;
}
```

### `MantenimientoUpdate`

Interface for updating maintenance records:

```typescript
export interface MantenimientoUpdate {
  estado?:
    | "Programado"
    | "En Progreso"
    | "Completado"
    | "Cancelado"
    | "Pospuesto";
  fechaInicio?: string;
  fechaFinalizacion?: string;
  tecnicoEjecutor?: string;
  observacionesEjecucion?: string;
  resultados?: string;
  repuestosUtilizados?: Array<{
    nombre: string;
    cantidad: number;
    numeroSerie?: string;
    costo?: number;
  }>;
  tiempoReal?: number;
  costoReal?: number;
  proximoMantenimiento?: string;
}
```

### `Mantenimiento`

Complete maintenance record interface:

```typescript
export interface Mantenimiento {
  id: string;
  equipoId: string;
  tipoMantenimiento: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  fechaProgramada: string;
  fechaInicio?: string;
  fechaFinalizacion?: string;
  tecnicoAsignado?: string;
  tecnicoEjecutor?: string;
  observaciones?: string;
  observacionesEjecucion?: string;
  resultados?: string;
  tiempoEstimado?: number;
  tiempoReal?: number;
  costoEstimado?: number;
  costoReal?: number;
  proximoMantenimiento?: string;
  createdAt: string;
  updatedAt: string;

  // Related data
  equipo?: Equipo;
  repuestosNecesarios?: RepuestoNecesario[];
  repuestosUtilizados?: RepuestoUtilizado[];
}
```

## Maintenance Types

### Preventivo

Regular scheduled maintenance to prevent equipment failures:

- Cleaning and calibration
- Component inspection
- Performance testing
- Preventive part replacement

### Correctivo

Maintenance to fix identified problems:

- Repair faulty components
- Replace damaged parts
- Restore equipment functionality
- Address performance issues

### Predictivo

Maintenance based on condition monitoring:

- Sensor data analysis
- Performance trend monitoring
- Predictive failure analysis
- Optimized maintenance scheduling

### Emergencia

Urgent maintenance for critical equipment failures:

- Immediate response required
- High priority execution
- Minimal downtime objective
- Emergency part procurement

## Error Handling

Common error scenarios in maintenance operations:

```typescript
try {
  const result = await mantenimientosFunction(params);
  return result;
} catch (error) {
  if (error.message.includes("equipment_not_found")) {
    console.error("❌ Equipment not found for maintenance");
  } else if (error.message.includes("technician_not_available")) {
    console.error("❌ Assigned technician is not available");
  } else if (error.message.includes("invalid_date")) {
    console.error("❌ Invalid maintenance date specified");
  } else {
    console.error("❌ Error in MantenimientosModule.functionName:", error);
    throw error;
  }
}
```

## Integration Points

The Mantenimientos module integrates with:

- **Equipos Module**: Links maintenance to specific equipment
- **Stock Module**: Manages parts and supplies for maintenance
- **Usuarios Module**: Tracks technician assignments and responsibilities
- **Supabase Tables**:
  - `mantenimientos`
  - `repuestos_necesarios`
  - `repuestos_utilizados`
  - `equipos` (for equipment details)

## Maintenance Workflow

1. **Planning**: Schedule maintenance based on equipment needs
2. **Preparation**: Assign technician and prepare required parts
3. **Execution**: Perform maintenance tasks and document progress
4. **Completion**: Record results and update equipment status
5. **Follow-up**: Schedule next maintenance and update records

## Performance Considerations

- Maintenance queries are optimized for date range filtering
- Equipment data is joined efficiently for complete information
- Bulk updates are supported for multiple maintenance records
- Reporting queries use appropriate indexes for fast execution

## Reporting Features

The module supports various maintenance reports:

1. **Maintenance Schedule**: Upcoming and overdue maintenance
2. **Technician Workload**: Assignments by technician
3. **Equipment History**: Complete maintenance history per equipment
4. **Cost Analysis**: Maintenance costs and trends
5. **Performance Metrics**: Completion rates and response times

## Best Practices

1. **Schedule preventive maintenance** regularly to avoid failures
2. **Document all activities** thoroughly for audit trails
3. **Track part usage** accurately for inventory management
4. **Monitor response times** for emergency maintenance
5. **Use proper priority levels** for resource allocation
6. **Update equipment status** after maintenance completion
7. **Plan ahead** for parts procurement and technician availability

## Testing

The module includes comprehensive tests covering:

- Maintenance creation with various types and priorities
- Status updates and workflow transitions
- Integration with equipment and stock modules
- Error handling and validation scenarios
- Performance benchmarks for large datasets

Example test:

```typescript
import {
  createMantenimiento,
  updateMantenimiento,
} from "@/lib/database/mantenimientos";

describe("Mantenimientos Module", () => {
  test("should create and update maintenance record", async () => {
    const mantenimientoData = {
      equipoId: "test-equipo",
      tipoMantenimiento: "Preventivo",
      descripcion: "Test maintenance",
      fechaProgramada: "2024-02-15",
      prioridad: "Media",
    };

    const mantenimiento = await createMantenimiento(mantenimientoData);
    expect(mantenimiento.id).toBeDefined();
    expect(mantenimiento.estado).toBe("Programado");

    await updateMantenimiento(mantenimiento.id, {
      estado: "Completado",
      resultados: "Maintenance completed successfully",
    });
  });
});
```
