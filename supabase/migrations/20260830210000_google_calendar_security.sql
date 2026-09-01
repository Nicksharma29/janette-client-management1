-- ============================================================
-- JANETTE CLIENT MANAGEMENT
-- GOOGLE CALENDAR SECURITY + DUPLICATE PROTECTION
-- ============================================================

-- 1. OAuth tokens must never be readable by the browser/client.
-- The server-side automation uses the Supabase service-role key,
-- so authenticated users do not need SELECT access to this table.

DROP POLICY IF EXISTS "Users can view their own Google Calendar connection"
ON public.google_calendar_connections;


-- 2. Prevent authenticated users from directly reading OAuth tokens.
REVOKE SELECT ON TABLE public.google_calendar_connections
FROM authenticated;


-- 3. Prevent authenticated users from directly modifying OAuth
-- connection records. Google OAuth is handled server-side.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.google_calendar_connections
FROM authenticated;


-- 4. Protect against duplicate TIE renewal calendar records.
-- One TIE document can have only one tie_renewal event record.

CREATE UNIQUE INDEX IF NOT EXISTS
google_calendar_events_tie_renewal_unique
ON public.google_calendar_events (document_id, event_type)
WHERE event_type = 'tie_renewal';
