-- =====================================================
-- PUSH NOTIFICATION SYSTEM MIGRATION
-- =====================================================

-- Enable pg_net extension (for HTTP calls from DB triggers)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enable pg_cron extension (for scheduled overdue check)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- TABLES
-- =====================================================

-- Push tokens table: stores Expo push tokens per user
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT DEFAULT 'android',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Notifications log table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'assignment_completed',
    'all_assignments_completed', 
    'daily_log_submitted',
    'assignment_overdue'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_is_sent ON notifications(is_sent);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Push tokens: users can manage their own tokens
CREATE POLICY "Users can view their own tokens" ON push_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tokens" ON push_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own tokens" ON push_tokens
  FOR DELETE USING (user_id = auth.uid());

-- Notifications: users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

-- Allow service role and triggers to insert notifications
CREATE POLICY "Service can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Allow all authenticated users to insert push tokens
-- (since we use pseudoHash and not Supabase Auth, we need broader access)
CREATE POLICY "Allow all inserts to push_tokens" ON push_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all selects on push_tokens" ON push_tokens
  FOR SELECT USING (true);

CREATE POLICY "Allow all updates on push_tokens" ON push_tokens
  FOR UPDATE USING (true);

-- =====================================================
-- FUNCTION: Send Expo Push Notification via pg_net
-- =====================================================

CREATE OR REPLACE FUNCTION send_expo_push_notification(
  p_recipient_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'
) RETURNS VOID AS $$
DECLARE
  v_token TEXT;
  v_token_record RECORD;
BEGIN
  -- Get all push tokens for the recipient
  FOR v_token_record IN 
    SELECT token FROM push_tokens WHERE user_id = p_recipient_id
  LOOP
    -- Send via Expo Push API using pg_net
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json',
        'Accept-Encoding', 'gzip, deflate'
      ),
      body := jsonb_build_object(
        'to', v_token_record.token,
        'title', p_title,
        'body', p_body,
        'sound', 'default',
        'data', p_data,
        'priority', 'high',
        'channelId', 'default'
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Assignment Completed → Notify Coach
-- =====================================================

CREATE OR REPLACE FUNCTION notify_on_assignment_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id UUID;
  v_student_name TEXT;
  v_assignment_title TEXT;
  v_total_assignments INT;
  v_completed_assignments INT;
BEGIN
  -- Only fire when is_completed changes from false to true
  IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
    -- Get coach_id and student name
    SELECT s.coach_id, u.name INTO v_coach_id, v_student_name
    FROM students s
    JOIN users u ON u.id = s.id
    WHERE s.id = NEW.student_id;

    v_assignment_title := NEW.title;

    -- Send "assignment completed" notification
    PERFORM send_expo_push_notification(
      v_coach_id,
      '✅ Ödev Tamamlandı',
      v_student_name || ' "' || v_assignment_title || '" ödevini tamamladı.',
      jsonb_build_object('type', 'assignment_completed', 'student_id', NEW.student_id, 'assignment_id', NEW.id)
    );

    -- Log notification
    INSERT INTO notifications (recipient_id, sender_id, type, title, body, data, is_sent)
    VALUES (
      v_coach_id, NEW.student_id, 'assignment_completed',
      '✅ Ödev Tamamlandı',
      v_student_name || ' "' || v_assignment_title || '" ödevini tamamladı.',
      jsonb_build_object('student_id', NEW.student_id, 'assignment_id', NEW.id),
      TRUE
    );

    -- Check if ALL assignments are completed
    SELECT 
      COUNT(*), 
      COUNT(*) FILTER (WHERE is_completed = TRUE)
    INTO v_total_assignments, v_completed_assignments
    FROM assignments
    WHERE student_id = NEW.student_id;

    IF v_total_assignments > 0 AND v_total_assignments = v_completed_assignments THEN
      PERFORM send_expo_push_notification(
        v_coach_id,
        '🎉 Tüm Ödevler Tamamlandı!',
        v_student_name || ' tüm ödevlerini tamamladı! (' || v_total_assignments || ' ödev)',
        jsonb_build_object('type', 'all_assignments_completed', 'student_id', NEW.student_id)
      );

      INSERT INTO notifications (recipient_id, sender_id, type, title, body, data, is_sent)
      VALUES (
        v_coach_id, NEW.student_id, 'all_assignments_completed',
        '🎉 Tüm Ödevler Tamamlandı!',
        v_student_name || ' tüm ödevlerini tamamladı! (' || v_total_assignments || ' ödev)',
        jsonb_build_object('student_id', NEW.student_id),
        TRUE
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_assignment_completed
  AFTER UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_assignment_complete();

-- =====================================================
-- TRIGGER: Daily Log Submitted → Notify Coach
-- =====================================================

CREATE OR REPLACE FUNCTION notify_on_daily_log()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id UUID;
  v_student_name TEXT;
  v_total_questions INT;
BEGIN
  -- Get coach_id and student name
  SELECT s.coach_id, u.name INTO v_coach_id, v_student_name
  FROM students s
  JOIN users u ON u.id = s.id
  WHERE s.id = NEW.student_id;

  -- Calculate total questions solved today by this student
  SELECT COALESCE(SUM(questions_solved), 0) INTO v_total_questions
  FROM daily_logs
  WHERE student_id = NEW.student_id AND date = NEW.date;

  -- Send notification
  PERFORM send_expo_push_notification(
    v_coach_id,
    '📝 Soru Çözümü Girildi',
    v_student_name || ' bugün ' || NEW.subject || ' dersinden ' || NEW.questions_solved || ' soru çözdü. (Toplam: ' || v_total_questions || ')',
    jsonb_build_object('type', 'daily_log_submitted', 'student_id', NEW.student_id)
  );

  -- Log notification
  INSERT INTO notifications (recipient_id, sender_id, type, title, body, data, is_sent)
  VALUES (
    v_coach_id, NEW.student_id, 'daily_log_submitted',
    '📝 Soru Çözümü Girildi',
    v_student_name || ' bugün ' || NEW.subject || ' dersinden ' || NEW.questions_solved || ' soru çözdü.',
    jsonb_build_object('student_id', NEW.student_id),
    TRUE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_daily_log_submitted
  AFTER INSERT ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_daily_log();

-- =====================================================
-- FUNCTION: Check Overdue Assignments (daily cron)
-- =====================================================

CREATE OR REPLACE FUNCTION check_overdue_assignments()
RETURNS VOID AS $$
DECLARE
  v_record RECORD;
  v_coach_id UUID;
  v_student_name TEXT;
  v_overdue_count INT;
  v_overdue_titles TEXT;
BEGIN
  -- Find students with overdue assignments (due_date = yesterday, not completed)
  FOR v_record IN
    SELECT 
      a.student_id,
      s.coach_id,
      u.name as student_name,
      COUNT(*) as overdue_count,
      STRING_AGG(a.title, ', ' ORDER BY a.due_date) as overdue_titles
    FROM assignments a
    JOIN students s ON s.id = a.student_id
    JOIN users u ON u.id = s.id
    WHERE a.due_date = CURRENT_DATE - INTERVAL '1 day'
      AND a.is_completed = FALSE
    GROUP BY a.student_id, s.coach_id, u.name
  LOOP
    -- Send overdue notification to coach
    PERFORM send_expo_push_notification(
      v_record.coach_id,
      '⚠️ Geciken Ödev',
      v_record.student_name || ' - ' || v_record.overdue_count || ' ödev gecikti: ' || v_record.overdue_titles,
      jsonb_build_object('type', 'assignment_overdue', 'student_id', v_record.student_id)
    );

    -- Log notification
    INSERT INTO notifications (recipient_id, sender_id, type, title, body, data, is_sent)
    VALUES (
      v_record.coach_id, v_record.student_id, 'assignment_overdue',
      '⚠️ Geciken Ödev',
      v_record.student_name || ' - ' || v_record.overdue_count || ' ödev gecikti: ' || v_record.overdue_titles,
      jsonb_build_object('student_id', v_record.student_id),
      TRUE
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule daily overdue check at 09:00 UTC (12:00 Turkey time)
SELECT cron.schedule(
  'check-overdue-assignments',
  '0 9 * * *',
  $$SELECT check_overdue_assignments()$$
);
