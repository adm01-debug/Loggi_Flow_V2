-- Migration: Create notifications table and realtime subscriptions

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error, achievement
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_action_url, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for all users (broadcast)
CREATE OR REPLACE FUNCTION broadcast_notification(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
  SELECT id, p_title, p_message, p_type, p_action_url, p_metadata
  FROM auth.users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notifications on important events
CREATE OR REPLACE FUNCTION notify_on_ocorrencia()
RETURNS trigger AS $$
BEGIN
  -- Notify when new ocorrência is created
  IF TG_OP = 'INSERT' THEN
    -- Broadcast to all users (or could be filtered by role)
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    SELECT 
      ul.user_id,
      '⚠️ Nova Ocorrência',
      'Uma nova ocorrência foi registrada: ' || NEW.tipo_ocorrencia,
      'warning',
      '/ocorrencias',
      jsonb_build_object('ocorrencia_id', NEW.id)
    FROM user_levels ul;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_ocorrencia_trigger
AFTER INSERT ON ocorrencias
FOR EACH ROW EXECUTE FUNCTION notify_on_ocorrencia();

-- Trigger for SLA violations
CREATE OR REPLACE FUNCTION notify_on_sla_violation()
RETURNS trigger AS $$
DECLARE
  v_dias_atraso INTEGER;
BEGIN
  -- Check if coleta is overdue (more than 3 days)
  IF NEW.status NOT IN ('finalizada', 'cancelada') AND OLD.status = NEW.status THEN
    v_dias_atraso := EXTRACT(DAY FROM (NOW() - NEW.created_at));
    
    IF v_dias_atraso >= 3 AND v_dias_atraso < 4 THEN
      INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
      SELECT 
        ul.user_id,
        '🚨 SLA em Risco',
        'Coleta ' || NEW.numero_coleta || ' está há ' || v_dias_atraso || ' dias pendente',
        'error',
        '/coletas',
        jsonb_build_object('coleta_id', NEW.id, 'dias_atraso', v_dias_atraso)
      FROM user_levels ul;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION broadcast_notification TO authenticated;

-- Add comments
COMMENT ON TABLE notifications IS 'User notifications with realtime support';
COMMENT ON FUNCTION create_notification IS 'Creates a notification for a specific user';
COMMENT ON FUNCTION broadcast_notification IS 'Creates a notification for all users';
