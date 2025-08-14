'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Clock, 
  MapPin, 
  Monitor,
  AlertTriangle,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ActiveSession {
  id: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  expires_at: string;
  last_used_at: string;
  user?: {
    nombre: string;
    email: string;
    rol: string;
  };
}

interface SessionStats {
  total_sessions: number;
  unique_users: number;
  expired_sessions: number;
  stale_sessions: number;
  sessions_by_role: Record<string, number>;
}

export default function SessionMonitor() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      
      // This would need to be implemented as an API endpoint
      // For now, we'll simulate the data structure
      const mockSessions: ActiveSession[] = [
        {
          id: '1',
          user_id: user?.id || '1',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
          last_used_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          user: {
            nombre: user?.nombre || 'Current User',
            email: user?.email || 'user@example.com',
            rol: user?.rol || 'admin'
          }
        }
      ];

      const mockStats: SessionStats = {
        total_sessions: mockSessions.length,
        unique_users: 1,
        expired_sessions: 0,
        stale_sessions: 0,
        sessions_by_role: {
          admin: 1,
          user: 0
        }
      };

      setSessions(mockSessions);
      setStats(mockStats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      // This would call an API to terminate the session
      console.log('Terminating session:', sessionId);
      
      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      alert('Session terminated successfully');
    } catch (err) {
      alert(`Failed to terminate session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchSessionData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSessionData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return `${minutes}m ago`;
  };

  const getSessionStatus = (session: ActiveSession) => {
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const lastUsed = new Date(session.last_used_at);
    
    if (expiresAt < now) {
      return { status: 'expired', color: 'bg-red-500' };
    }
    
    const staleThreshold = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes
    if (lastUsed < staleThreshold) {
      return { status: 'stale', color: 'bg-yellow-500' };
    }
    
    return { status: 'active', color: 'bg-green-500' };
  };

  const getBrowserInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Browser';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Unknown Browser';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading session data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading session data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Monitor</h1>
          <p className="text-muted-foreground">
            Monitor and manage active user sessions
          </p>
        </div>
        
        <Button onClick={fetchSessionData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Session Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sessions}</div>
              <p className="text-xs text-muted-foreground">
                Active user sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unique_users}</div>
              <p className="text-xs text-muted-foreground">
                Currently logged in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Sessions</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired_sessions}</div>
              <p className="text-xs text-muted-foreground">
                Need cleanup
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stale Sessions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.stale_sessions}</div>
              <p className="text-xs text-muted-foreground">
                Inactive > 30min
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Currently active user sessions with details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No active sessions found
              </p>
            ) : (
              sessions.map((session) => {
                const sessionStatus = getSessionStatus(session);
                
                return (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${sessionStatus.color}`} />
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{session.user?.nombre}</span>
                          <Badge variant="outline">{session.user?.rol}</Badge>
                          <Badge variant="secondary" className="capitalize">
                            {sessionStatus.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{session.ip_address || 'Unknown IP'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Monitor className="h-3 w-3" />
                            <span>{getBrowserInfo(session.user_agent)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Last active {formatDuration(session.last_used_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Created: {new Date(session.created_at).toLocaleString()}</p>
                        <p>Expires: {new Date(session.expires_at).toLocaleString()}</p>
                      </div>
                      
                      {session.user_id !== user?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions by Role */}
      {stats && Object.keys(stats.sessions_by_role).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sessions by Role</CardTitle>
            <CardDescription>
              Distribution of active sessions by user role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.sessions_by_role).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="capitalize">{role}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}