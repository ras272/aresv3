# Shared Performance Documentation

## Overview

The shared performance module provides performance monitoring, optimization utilities, and metrics collection for all database modules. It helps identify bottlenecks, track operation times, and optimize system performance.

## Performance Monitoring

### `performanceMonitor`

Central performance monitoring system that tracks operation metrics.

**Features:**
- Operation timing
- Memory usage tracking
- Query performance analysis
- Bottleneck identification
- Performance trend analysis

**Example:**
```typescript
import { performanceMonitor } from '@/lib/database/shared/performance'

// Start monitoring an operation
const monitor = performanceMonitor.start('createEquipo')

try {
  const equipo = await database.equipos.create(equipoData)
  
  // Record successful completion
  monitor.success({
    recordsAffected: 1,
    memoryUsed: process.memoryUsage().heapUsed
  })
  
  return equipo
} catch (error) {
  // Record failure
  monitor.error(error)
  throw error
}
```

### `withPerformanceMonitoring(func, operationName): Function`

Higher-order function that wraps any function with performance monitoring.

**Parameters:**
- `func`: Function to monitor
- `operationName`: Name for the operation in metrics

**Returns:** Wrapped function with automatic performance tracking

**Example:**
```typescript
import { withPerformanceMonitoring } from '@/lib/database/shared/performance'

// Wrap a function with monitoring
const monitoredCreateEquipo = withPerformanceMonitoring(
  async (equipoData: EquipoInput) => {
    return await database.equipos.create(equipoData)
  },
  'createEquipo'
)

// Usage - monitoring happens automatically
const equipo = await monitoredCreateEquipo(equipoData)
```

### Decorator Usage

For class methods, use the performance monitoring decorator:

```typescript
import { performanceMonitored } from '@/lib/database/shared/performance'

class MercaderiasService {
  @performanceMonitored('createCargaMercaderia')
  async createCargaMercaderia(cargaData: CargaMercaderiaInput): Promise<CargaMercaderia> {
    // Method implementation
    return await this.database.cargas.create(cargaData)
  }
}
```

## Performance Metrics

### Operation Metrics

The system tracks various metrics for each operation:

```typescript
interface OperationMetrics {
  operationName: string
  startTime: number
  endTime: number
  duration: number
  success: boolean
  error?: string
  metadata: {
    recordsAffected?: number
    memoryUsed?: number
    queryCount?: number
    cacheHits?: number
    cacheMisses?: number
  }
}
```

### System Metrics

Overall system performance metrics:

```typescript
interface SystemMetrics {
  totalOperations: number
  averageResponseTime: number
  errorRate: number
  throughput: number // operations per second
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
  }
  databaseMetrics: {
    activeConnections: number
    queryTime: number
    slowQueries: number
  }
}
```

## Performance Analysis

### `getPerformanceReport(timeRange?): PerformanceReport`

Generates comprehensive performance reports.

**Example:**
```typescript
import { getPerformanceReport } from '@/lib/database/shared/performance'

// Get performance report for the last hour
const report = await getPerformanceReport({
  startTime: Date.now() - (60 * 60 * 1000),
  endTime: Date.now()
})

console.log('Performance Report:')
console.log(`Total operations: ${report.totalOperations}`)
console.log(`Average response time: ${report.averageResponseTime}ms`)
console.log(`Error rate: ${report.errorRate}%`)
console.log(`Slowest operations:`, report.slowestOperations)
```

### `identifyBottlenecks(): BottleneckAnalysis`

Identifies performance bottlenecks in the system.

**Example:**
```typescript
import { identifyBottlenecks } from '@/lib/database/shared/performance'

const analysis = await identifyBottlenecks()

console.log('Performance Bottlenecks:')
analysis.bottlenecks.forEach(bottleneck => {
  console.log(`- ${bottleneck.operation}: ${bottleneck.averageTime}ms`)
  console.log(`  Recommendation: ${bottleneck.recommendation}`)
})
```

## Optimization Utilities

### Query Optimization

#### `optimizeQuery(query, options?): OptimizedQuery`

Optimizes database queries for better performance.

**Example:**
```typescript
import { optimizeQuery } from '@/lib/database/shared/performance'

const originalQuery = supabase
  .from('equipos')
  .select('*')
  .eq('cliente', 'Hospital Central')

const optimizedQuery = optimizeQuery(originalQuery, {
  useIndex: ['cliente'],
  selectFields: ['id', 'nombre', 'estado'],
  limit: 100
})
```

#### `batchQueries(queries): Promise<Results[]>`

Batches multiple queries for better performance.

**Example:**
```typescript
import { batchQueries } from '@/lib/database/shared/performance'

const queries = [
  supabase.from('equipos').select('count'),
  supabase.from('mantenimientos').select('count'),
  supabase.from('stock_items').select('count')
]

const results = await batchQueries(queries)
console.log('Counts:', results.map(r => r.count))
```

### Memory Optimization

#### `optimizeMemoryUsage(options?): void`

Optimizes memory usage across the application.

**Example:**
```typescript
import { optimizeMemoryUsage } from '@/lib/database/shared/performance'

// Run memory optimization
optimizeMemoryUsage({
  clearCache: true,
  garbageCollect: true,
  compactHeap: true
})
```

#### `monitorMemoryLeaks(): MemoryMonitor`

Monitors for potential memory leaks.

**Example:**
```typescript
import { monitorMemoryLeaks } from '@/lib/database/shared/performance'

const monitor = monitorMemoryLeaks()

// Check for leaks periodically
setInterval(() => {
  const leaks = monitor.checkForLeaks()
  if (leaks.length > 0) {
    console.warn('Potential memory leaks detected:', leaks)
  }
}, 60000) // Check every minute
```

## Caching System

### `createCache(options): Cache`

Creates a performance-optimized cache.

**Example:**
```typescript
import { createCache } from '@/lib/database/shared/performance'

const equiposCache = createCache({
  maxSize: 1000,
  ttl: 300000, // 5 minutes
  strategy: 'lru' // least recently used
})

// Cache usage
const getCachedEquipo = async (id: string) => {
  const cached = equiposCache.get(id)
  if (cached) return cached
  
  const equipo = await database.equipos.findById(id)
  equiposCache.set(id, equipo)
  return equipo
}
```

### Cache Strategies

#### LRU (Least Recently Used)
```typescript
const lruCache = createCache({
  strategy: 'lru',
  maxSize: 1000
})
```

#### TTL (Time To Live)
```typescript
const ttlCache = createCache({
  strategy: 'ttl',
  ttl: 300000 // 5 minutes
})
```

#### LFU (Least Frequently Used)
```typescript
const lfuCache = createCache({
  strategy: 'lfu',
  maxSize: 500
})
```

## Database Connection Optimization

### Connection Pooling

```typescript
import { optimizeConnectionPool } from '@/lib/database/shared/performance'

// Optimize Supabase connection pool
optimizeConnectionPool({
  minConnections: 5,
  maxConnections: 20,
  idleTimeout: 30000,
  connectionTimeout: 5000
})
```

### Query Batching

```typescript
import { createQueryBatcher } from '@/lib/database/shared/performance'

const batcher = createQueryBatcher({
  batchSize: 10,
  flushInterval: 100 // ms
})

// Queries are automatically batched
batcher.add(query1)
batcher.add(query2)
batcher.add(query3)
// All three queries will be executed together
```

## Performance Alerts

### `setupPerformanceAlerts(config): AlertSystem`

Sets up automated performance alerts.

**Example:**
```typescript
import { setupPerformanceAlerts } from '@/lib/database/shared/performance'

const alerts = setupPerformanceAlerts({
  thresholds: {
    responseTime: 1000, // ms
    errorRate: 5, // percentage
    memoryUsage: 80 // percentage
  },
  notifications: {
    email: 'admin@example.com',
    webhook: 'https://alerts.example.com/webhook'
  }
})

// Alerts will be sent automatically when thresholds are exceeded
```

## Performance Testing

### Load Testing

```typescript
import { runLoadTest } from '@/lib/database/shared/performance'

const loadTestResults = await runLoadTest({
  operation: 'createEquipo',
  concurrency: 10,
  duration: 60000, // 1 minute
  rampUp: 5000 // 5 seconds
})

console.log('Load Test Results:')
console.log(`Requests per second: ${loadTestResults.rps}`)
console.log(`Average response time: ${loadTestResults.avgResponseTime}ms`)
console.log(`Error rate: ${loadTestResults.errorRate}%`)
```

### Stress Testing

```typescript
import { runStressTest } from '@/lib/database/shared/performance'

const stressTestResults = await runStressTest({
  operation: 'getAllEquipos',
  maxConcurrency: 100,
  stepSize: 10,
  stepDuration: 30000 // 30 seconds per step
})
```

## Performance Best Practices

### Database Operations

1. **Use Indexes**: Ensure proper indexing for frequently queried fields
```typescript
// Good: Query with indexed field
const equipos = await supabase
  .from('equipos')
  .select('*')
  .eq('cliente', clienteId) // 'cliente' should be indexed
```

2. **Limit Results**: Always use appropriate limits for large datasets
```typescript
// Good: Limited query
const equipos = await supabase
  .from('equipos')
  .select('*')
  .limit(100)
```

3. **Select Specific Fields**: Only select needed fields
```typescript
// Good: Specific field selection
const equipos = await supabase
  .from('equipos')
  .select('id, nombre, estado')
```

### Memory Management

1. **Clean Up Resources**: Always clean up resources after use
```typescript
// Good: Resource cleanup
const processLargeDataset = async (data: any[]) => {
  const processor = new DataProcessor()
  try {
    return await processor.process(data)
  } finally {
    processor.cleanup() // Clean up resources
  }
}
```

2. **Use Streaming**: For large datasets, use streaming
```typescript
// Good: Streaming large results
const processAllEquipos = async () => {
  const stream = supabase
    .from('equipos')
    .select('*')
    .stream()
    
  for await (const batch of stream) {
    await processBatch(batch)
  }
}
```

### Caching Strategy

1. **Cache Frequently Accessed Data**: Cache data that's accessed often
```typescript
// Good: Cache frequently accessed clinics
const getClinics = async () => {
  const cached = cache.get('all_clinics')
  if (cached) return cached
  
  const clinics = await supabase.from('clinicas').select('*')
  cache.set('all_clinics', clinics, 300000) // 5 minutes
  return clinics
}
```

2. **Invalidate Cache Appropriately**: Clear cache when data changes
```typescript
// Good: Cache invalidation on update
const updateClinica = async (id: string, updates: any) => {
  const result = await supabase
    .from('clinicas')
    .update(updates)
    .eq('id', id)
    
  // Invalidate related cache
  cache.delete('all_clinics')
  cache.delete(`clinica_${id}`)
  
  return result
}
```

## Monitoring Dashboard

The performance module provides a monitoring dashboard:

```typescript
import { createPerformanceDashboard } from '@/lib/database/shared/performance'

const dashboard = createPerformanceDashboard({
  refreshInterval: 5000, // 5 seconds
  metrics: [
    'responseTime',
    'throughput',
    'errorRate',
    'memoryUsage',
    'databaseConnections'
  ]
})

// Dashboard will automatically update with real-time metrics
dashboard.start()
```

## Integration with Monitoring Services

### Application Performance Monitoring (APM)

```typescript
import { integrateAPM } from '@/lib/database/shared/performance'

// Integrate with external APM service
integrateAPM({
  service: 'newrelic', // or 'datadog', 'dynatrace', etc.
  apiKey: process.env.APM_API_KEY,
  appName: 'arestech-care-demo'
})
```

### Custom Metrics Export

```typescript
import { exportMetrics } from '@/lib/database/shared/performance'

// Export metrics to external system
await exportMetrics({
  destination: 'prometheus',
  endpoint: 'http://prometheus:9090/metrics',
  interval: 60000 // Export every minute
})
```