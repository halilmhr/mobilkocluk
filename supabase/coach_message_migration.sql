-- =====================================================
-- COACH MESSAGE NOTIFICATION MIGRATION
-- =====================================================

-- Add 'coach_message' to notifications type constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'assignment_completed',
    'all_assignments_completed', 
    'daily_log_submitted',
    'assignment_overdue',
    'coach_message'
  ));

-- Grant RPC access to send_expo_push_notification for client calls
-- (already SECURITY DEFINER, just needs to be callable)
GRANT EXECUTE ON FUNCTION send_expo_push_notification(UUID, TEXT, TEXT, JSONB) TO anon, authenticated;

-- Allow all inserts to notifications (for coach messages from client)
DROP POLICY IF EXISTS "Allow all inserts to notifications" ON notifications;
CREATE POLICY "Allow all inserts to notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Allow all selects on notifications
DROP POLICY IF EXISTS "Allow all selects on notifications" ON notifications;
CREATE POLICY "Allow all selects on notifications" ON notifications
  FOR SELECT USING (true);
