'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Users, 
  TrendingUp,
  RefreshCw,
  Database,
  Zap
} from 'lucide-react';

interface DashboardData {
  total_events: number;
  failed_logins: number;
  successful_logins: number;
  suspicious_activities: number;
  critical_alerts: number;
  high_alerts: number;
  average_response_time: number;
  slow_operations: number;
  success_rate: number;
}

interface SuspiciousActivity {
  id: string;
  type: string;
  email?: string;
  ip_address?: string;
  severity: 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: string;
}

interface EventByType {
  event_type: string;
  count: number;
}

interface TopIP {
  ip_address: string;
  count: number;
}

interface SecurityDashboardData {
  dashboard: DashboardData;
  suspicious_activities: SuspiciousActivity[];
  events_by_type: EventByType[];
  top_ips: TopIP[];
  time_range: {
    hours_back: number;
    since: string;
    until: string;
  };
}

interface CleanupStats {
  activeSessions: number;
  expiredSessions: number;
  recentSecurityEvents: number;
  recentPerformanceMetrics: number;
  suspiciousActivities: number;
}

export default function SecurityDashboard() {
  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoursBack, setHoursBack] = useState(24);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/security/dashboard?hours=${hoursBack}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCleanupStats = async () => {
    try {
      const response = await fetch('/api/security/cleanup');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cleanup stats');
      }
      
      const statsData = await response.json();
      setCleanupStats(statsData.stats);
    } catch (err) {
      console.error('Error fetching cleanup stats:', err);
    }
  };

  const runCleanup = async () => {
    try {
      setCleanupLoading(true);
      const response = await fetch('/api/security/cleanup', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Cleanup failed');
      }
      
      const result = await response.json();
      
      // Refresh data after cleanup
      await fetchDashboardData();
      await fetchCleanupStats();
      
      alert(`Cleanup completed! Cleaned ${result.cleanup_result.totalCleaned} items.`);
    } catch (err) {
      alert(`Cleanup failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchCleanupStats();
  }, [hoursBack]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading security dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading security dashboard: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No security data available
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitoring security events for the last {hoursBack} hours
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select 
            value={hoursBack} 
            onChange={(e) => setHoursBack(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last Week</option>
          </select>
          
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            onClick={runCleanup} 
            variant="outline"
            disabled={cleanupLoading}
          >
            <Database className="h-4 w-4 mr-2" />
            {cleanupLoading ? 'Cleaning...' : 'Run Cleanup'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dashboard.total_events}</div>
            <p className="text-xs text-muted-foreground">
              Security events logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.dashboard.failed_logins}</div>
            <p className="text-xs text-muted-foreground">
              Authentication failures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.dashboard.success_rate}%</div>
            <p className="text-xs text-muted-foreground">
              Authentication success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dashboard.average_response_time}ms</div>
            <p className="text-xs text-muted-foreground">
              Average operation time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Alerts
            </CardTitle>
            <CardDescription>
              Critical and high-priority security events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Critical Alerts</span>
                <Badge variant="destructive">{data.dashboard.critical_alerts}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>High Priority Alerts</span>
                <Badge variant="secondary">{data.dashboard.high_alerts}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Suspicious Activities</span>
                <Badge variant="outline">{data.dashboard.suspicious_activities}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              System performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Slow Operations</span>
                <Badge variant={data.dashboard.slow_operations > 10 ? "destructive" : "secondary"}>
                  {data.dashboard.slow_operations}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Success Rate</span>
                <Badge variant={data.dashboard.success_rate < 95 ? "destructive" : "default"}>
                  {data.dashboard.success_rate}%
                </Badge>
              </div>
              {cleanupStats && (
                <div className="flex justify-between items-center">
                  <span>Active Sessions</span>
                  <Badge variant="outline">{cleanupStats.activeSessions}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious Activities */}
      {data.suspicious_activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Suspicious Activities</CardTitle>
            <CardDescription>
              Unresolved security concerns requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.suspicious_activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getSeverityColor(activity.severity)}>
                      {activity.severity}
                    </Badge>
                    <div>
                      <p className="font-medium">{activity.type.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.email || activity.ip_address || 'Unknown source'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Types and Top IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Events by Type</CardTitle>
            <CardDescription>
              Breakdown of security events by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.events_by_type.map((event) => (
                <div key={event.event_type} className="flex justify-between items-center">
                  <span className="capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                  <Badge variant="outline">{event.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top IP Addresses</CardTitle>
            <CardDescription>
              Most active IP addresses by event count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.top_ips.map((ip) => (
                <div key={ip.ip_address} className="flex justify-between items-center">
                  <span className="font-mono text-sm">{ip.ip_address}</span>
                  <Badge variant="outline">{ip.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}