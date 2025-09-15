-- Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'login_attempt', 'login_success', 'login_failure', 'logout', 
    'token_refresh', 'suspicious_activity', 'session_expired', 'account_locked'
  )),
  user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation VARCHAR(100) NOT NULL,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suspicious Activities Table
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'multiple_failed_logins', 'unusual_location', 'rapid_requests', 
    'token_manipulation', 'session_anomaly'
  )),
  user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  email VARCHAR(255),
  ip_address INET,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('medium', 'high', 'critical')),
  details JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_email ON security_events(email);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation ON performance_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_duration ON performance_metrics(duration_ms DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_success ON performance_metrics(success);

CREATE INDEX IF NOT EXISTS idx_suspicious_activities_timestamp ON suspicious_activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_type ON suspicious_activities(type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_severity ON suspicious_activities(severity);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_resolved ON suspicious_activities(resolved);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user_id ON suspicious_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_ip_address ON suspicious_activities(ip_address);

-- RLS Policies (Row Level Security)
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access these tables (for security)
CREATE POLICY "Service role only access" ON security_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only access" ON performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only access" ON suspicious_activities
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up old security events (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO security_events (event_type, severity, details)
  VALUES ('cleanup', 'low', jsonb_build_object('deleted_events', deleted_count));
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old performance metrics (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM performance_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security dashboard data
CREATE OR REPLACE FUNCTION get_security_dashboard_data(
  hours_back INTEGER DEFAULT 24
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  since_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  since_timestamp := NOW() - (hours_back || ' hours')::INTERVAL;
  
  SELECT json_build_object(
    'total_events', (
      SELECT COUNT(*) FROM security_events 
      WHERE timestamp >= since_timestamp
    ),
    'failed_logins', (
      SELECT COUNT(*) FROM security_events 
      WHERE event_type = 'login_failure' AND timestamp >= since_timestamp
    ),
    'successful_logins', (
      SELECT COUNT(*) FROM security_events 
      WHERE event_type = 'login_success' AND timestamp >= since_timestamp
    ),
    'suspicious_activities', (
      SELECT COUNT(*) FROM suspicious_activities 
      WHERE timestamp >= since_timestamp AND resolved = false
    ),
    'critical_alerts', (
      SELECT COUNT(*) FROM security_events 
      WHERE severity = 'critical' AND timestamp >= since_timestamp
    ),
    'high_alerts', (
      SELECT COUNT(*) FROM security_events 
      WHERE severity = 'high' AND timestamp >= since_timestamp
    ),
    'average_response_time', (
      SELECT COALESCE(AVG(duration_ms), 0) FROM performance_metrics 
      WHERE timestamp >= since_timestamp
    ),
    'slow_operations', (
      SELECT COUNT(*) FROM performance_metrics 
      WHERE duration_ms > 1000 AND timestamp >= since_timestamp
    ),
    'success_rate', (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 100
        ELSE ROUND((COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*)), 2)
      END
      FROM performance_metrics 
      WHERE timestamp >= since_timestamp
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;