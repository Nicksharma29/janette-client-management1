CREATE TABLE IF NOT EXISTS public.firm_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT firm_members_owner_member_unique UNIQUE (owner_id, member_id),
  CONSTRAINT firm_members_not_self CHECK (owner_id <> member_id)
);

ALTER TABLE public.firm_members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.firm_members FROM anon;
REVOKE ALL ON TABLE public.firm_members FROM authenticated;

CREATE OR REPLACE FUNCTION public.is_advocate()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'advocate'
  );
$$;

REVOKE ALL ON FUNCTION public.is_advocate() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_advocate() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_firm_member(target_owner_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.firm_members
    WHERE owner_id = target_owner_id
      AND member_id = auth.uid()
      AND role = 'staff'
  );
$$;

REVOKE ALL ON FUNCTION public.is_firm_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_firm_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_effective_owner_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'advocate'
      )
      THEN auth.uid()
      WHEN (
        SELECT COUNT(DISTINCT owner_id)
        FROM public.firm_members
        WHERE member_id = auth.uid()
          AND role = 'staff'
      ) = 1
      THEN (
        SELECT owner_id
        FROM public.firm_members
        WHERE member_id = auth.uid()
          AND role = 'staff'
        LIMIT 1
      )
      ELSE NULL
    END;
$$;

REVOKE ALL ON FUNCTION public.get_effective_owner_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_effective_owner_id() TO authenticated;

DROP POLICY IF EXISTS "Advocates can add firm members" ON public.firm_members;
DROP POLICY IF EXISTS "Advocates can remove firm members" ON public.firm_members;
DROP POLICY IF EXISTS "Advocates can view their firm members" ON public.firm_members;

CREATE POLICY "Advocates can add firm members"
ON public.firm_members
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND public.is_advocate()
);

CREATE POLICY "Advocates can remove firm members"
ON public.firm_members
FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
  AND public.is_advocate()
);

CREATE POLICY "Advocates can view their firm members"
ON public.firm_members
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  AND public.is_advocate()
);

DROP POLICY IF EXISTS "Firm users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Firm users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Firm users can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Advocates can update clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can update firm clients" ON public.clients;

CREATE POLICY "Firm users can view clients"
ON public.clients FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can create clients"
ON public.clients FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can delete clients"
ON public.clients FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Advocates can update clients"
ON public.clients FOR UPDATE TO authenticated
USING (owner_id = auth.uid() AND public.is_advocate())
WITH CHECK (owner_id = auth.uid() AND public.is_advocate());

CREATE POLICY "Staff can update firm clients"
ON public.clients FOR UPDATE TO authenticated
USING (public.is_firm_member(owner_id))
WITH CHECK (public.is_firm_member(owner_id));

DROP POLICY IF EXISTS "Firm users can view cases" ON public.cases;
DROP POLICY IF EXISTS "Firm users can create cases" ON public.cases;
DROP POLICY IF EXISTS "Firm users can delete cases" ON public.cases;
DROP POLICY IF EXISTS "Advocates can update cases" ON public.cases;
DROP POLICY IF EXISTS "Staff can update firm cases" ON public.cases;

CREATE POLICY "Firm users can view cases"
ON public.cases FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can create cases"
ON public.cases FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can delete cases"
ON public.cases FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Advocates can update cases"
ON public.cases FOR UPDATE TO authenticated
USING (owner_id = auth.uid() AND public.is_advocate())
WITH CHECK (owner_id = auth.uid() AND public.is_advocate());

CREATE POLICY "Staff can update firm cases"
ON public.cases FOR UPDATE TO authenticated
USING (public.is_firm_member(owner_id))
WITH CHECK (public.is_firm_member(owner_id));

DROP POLICY IF EXISTS "Firm users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Firm users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Firm users can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Advocates can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff can update firm tasks" ON public.tasks;

CREATE POLICY "Firm users can view tasks"
ON public.tasks FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can create tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can delete tasks"
ON public.tasks FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Advocates can update tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (owner_id = auth.uid() AND public.is_advocate())
WITH CHECK (owner_id = auth.uid() AND public.is_advocate());

CREATE POLICY "Staff can update firm tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (public.is_firm_member(owner_id))
WITH CHECK (public.is_firm_member(owner_id));

DROP POLICY IF EXISTS "Firm users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Firm users can create documents" ON public.documents;
DROP POLICY IF EXISTS "Firm users can delete documents" ON public.documents;
DROP POLICY IF EXISTS "Advocates can update documents" ON public.documents;
DROP POLICY IF EXISTS "Staff can update firm documents" ON public.documents;

CREATE POLICY "Firm users can view documents"
ON public.documents FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can create documents"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can delete documents"
ON public.documents FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Advocates can update documents"
ON public.documents FOR UPDATE TO authenticated
USING (owner_id = auth.uid() AND public.is_advocate())
WITH CHECK (owner_id = auth.uid() AND public.is_advocate());

CREATE POLICY "Staff can update firm documents"
ON public.documents FOR UPDATE TO authenticated
USING (public.is_firm_member(owner_id))
WITH CHECK (public.is_firm_member(owner_id));

DROP POLICY IF EXISTS "Firm users can view case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Firm users can create case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Firm users can update case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Firm users can delete case notes" ON public.case_notes;

CREATE POLICY "Firm users can view case notes"
ON public.case_notes FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can create case notes"
ON public.case_notes FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can update case notes"
ON public.case_notes FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id))
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can delete case notes"
ON public.case_notes FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

DROP POLICY IF EXISTS "Firm users can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Firm users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Firm users can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Firm users can delete appointments" ON public.appointments;

CREATE POLICY "Firm users can view appointments"
ON public.appointments FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can create appointments"
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can update appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id))
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can delete appointments"
ON public.appointments FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

DROP POLICY IF EXISTS "Firm users can create activity" ON public.activity_log;
DROP POLICY IF EXISTS "Firm users can view activity" ON public.activity_log;

CREATE POLICY "Firm users can create activity"
ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can view activity"
ON public.activity_log FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

DROP POLICY IF EXISTS "Firm users can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Firm users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Firm users can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Firm users can delete notifications" ON public.notifications;

CREATE POLICY "Firm users can view notifications"
ON public.notifications FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can create notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can update notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id))
WITH CHECK (owner_id = auth.uid() OR public.is_firm_member(owner_id));

CREATE POLICY "Firm users can delete notifications"
ON public.notifications FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_firm_member(owner_id));
