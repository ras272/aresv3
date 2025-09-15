-- =============================================
-- Security Monitoring Indexes
-- =============================================

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_user_email ON security_events(user_email);

CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_acknowledged ON security_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_performance_operation ON auth_performance_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_auth_performance_timestamp ON auth_performance_metrics(metric_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auth_performance_success ON auth_performance_metrics(success);

-- Add is_active column to active_sessions if it doesn't exist
ALTER TABLE active_sessions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for active sessions
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at);;
