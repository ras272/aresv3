'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Zap,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useOptimizedState, useThrottle } from '@/lib/react-optimization';

interface PerformanceMetrics {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  cacheHits: number;
  cacheMisses: number;
  blacklistSize: number;
  permissionsCacheSize: number;
  queryCacheSize: number;
}

interface SystemMetrics {
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
  nodeVersion: string;
  platform: string;
  timestamp: string;
}

interface PerformanceData {
  performance: PerformanceMetrics;
  system: SystemMetrics;
  recommendations: string[];
}

export default function PerformanceMonitor() {
  const [data, setData] = useOptimizedState<PerformanceData | null>(null);
  const [loading, setLoading] = useOptimizedState(true);
  const [error, setError] = useOptimizedState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useOptimizedState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/performance/metrics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }
      
      const metricsData = await response.json();
      setData(metricsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Throttle the refresh function to prevent excessive API calls
  const throttledRefresh = useThrottle(fetchMetrics, 1000);

  const performAction = async (action: string) => {
    try {
      const response = await fetch('/api/performance/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to perform action: ${action}`);
      }
      
      const result = await response.json();
      alert(result.message);
      
      // Refresh metrics after action
      await fetchMetrics();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getCacheHitRate = (): number => {
    if (!data) return 0;
    const total = data.performance.cacheHits + data.performance.cacheMisses;
    return total > 0 ? (data.performance.cacheHits / total) * 100 : 0;
  };

  const getPerformanceStatus = (): { status: string; color: string } => {
    if (!data) return { status: 'Unknown', color: 'bg-gray-500' };
    
    const cacheHitRate = getCacheHitRate();
    const avgQueryTime = data.performance.averageQueryTime;
    const slowQueryRate = data.performance.totalQueries > 0 
      ? (data.performance.slowQueries / data.performance.totalQueries) * 100 
      : 0;
    
    if (cacheHitRate > 90 && avgQueryTime < 100 && slowQueryRate < 5) {
      return { status: 'Excellent', color: 'bg-green-500' };
    } else if (cacheHitRate > 80 && avgQueryTime < 300 && slowQueryRate < 10) {
      return { status: 'Good', color: 'bg-blue-500' };
    } else if (cacheHitRate > 60 && avgQueryTime < 500 && slowQueryRate < 20) {
      return { status: 'Fair', color: 'bg-yellow-500' };
    } else {
      return { status: 'Poor', color: 'bg-red-500' };
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading performance metrics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No performance data available
        </AlertDescription>
      </Alert>
    );
  }

  const performanceStatus = getPerformanceStatus();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitor</h1>
          <p className="text-muted-foreground">
            System performance metrics and optimization insights
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Auto-refresh:</span>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'On' : 'Off'}
            </Button>
          </div>
          
          <Button onClick={throttledRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Overall Performance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Badge className={`${performanceStatus.color} text-white`}>
              {performanceStatus.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date(data.system.timestamp).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCacheHitRate().toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.performance.cacheHits} hits / {data.performance.cacheHits + data.performance.cacheMisses} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.averageQueryTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              {data.performance.totalQueries} total queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.performance.slowQueries}</div>
            <p className="text-xs text-muted-foreground">
              {data.performance.totalQueries > 0 
                ? ((data.performance.slowQueries / data.performance.totalQueries) * 100).toFixed(1)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(data.system.memory.heapUsed)}</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(data.system.memory.heapTotal)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Cache Statistics
            </CardTitle>
            <CardDescription>
              Current cache sizes and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Token Blacklist</span>
                <Badge variant="outline">{data.performance.blacklistSize}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Permissions Cache</span>
                <Badge variant="outline">{data.performance.permissionsCacheSize}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Query Cache</span>
                <Badge variant="outline">{data.performance.queryCacheSize}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              System Information
            </CardTitle>
            <CardDescription>
              Server runtime information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Uptime</span>
                <Badge variant="outline">{formatUptime(data.system.uptime)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Node.js Version</span>
                <Badge variant="outline">{data.system.nodeVersion}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Platform</span>
                <Badge variant="outline">{data.system.platform}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
            <CardDescription>
              Suggestions to improve system performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Actions</CardTitle>
          <CardDescription>
            Administrative actions to optimize performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => performAction('reset_metrics')}
            >
              Reset Metrics
            </Button>
            <Button 
              variant="outline" 
              onClick={() => performAction('clear_caches')}
            >
              Clear Caches
            </Button>
            <Button 
              variant="outline" 
              onClick={() => performAction('optimize_connections')}
            >
              Optimize Connections
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}