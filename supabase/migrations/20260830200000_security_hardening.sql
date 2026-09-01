-- ============================================================
-- JANETTE CLIENT MANAGEMENT
-- SECURITY HARDENING
-- ============================================================

-- 1. Prevent authenticated users from changing their own role.
--
-- The existing profile UPDATE policy allows a user to update their
-- own profile, but PostgreSQL RLS cannot restrict individual columns
-- with that policy. Remove the broad UPDATE policy and replace it
-- with a column-restricted policy.
--
-- Users may update their own full_name only.
-- role remains controlled by trusted server-side/admin operations.

DROP POLICY IF EXISTS "Users can update their own profile"
ON public.profiles;

DROP POLICY IF EXISTS "Users can update their own profile name"
ON public.profiles;

CREATE POLICY "Users can update their own profile name"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;


-- 2. Make sure authenticated users cannot directly delete
-- profiles.
--
-- There is currently no DELETE policy, so RLS already blocks this.
-- We explicitly leave it that way.


-- 3. Make sure anonymous users cannot access the application tables.
--
-- RLS policies currently target authenticated users only.
-- These REVOKEs provide an additional database privilege layer.

REVOKE ALL ON TABLE
  public.activity_log,
  public.appointments,
  public.case_notes,
  public.cases,
  public.clients,
  public.documents,
  public.google_calendar_connections,
  public.google_calendar_events,
  public.notifications,
  public.profiles,
  public.tasks
FROM anon;


-- 4. Keep authenticated access limited to the existing RLS policies.
--
-- Do NOT disable RLS.
-- Do NOT create permissive policies.
-- Existing owner_id-based policies remain responsible for row access.


-- 5. Verify RLS remains enabled.

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
