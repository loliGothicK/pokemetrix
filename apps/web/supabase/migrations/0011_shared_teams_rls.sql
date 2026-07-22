-- =========================================================
-- RLS: shared_teams
-- =========================================================
ALTER TABLE public.shared_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select all shared_teams" ON public.shared_teams
  FOR SELECT USING (true);

CREATE POLICY "insert all shared_teams" ON public.shared_teams
  FOR INSERT WITH CHECK (created_by IS NULL OR auth.uid() = created_by);

CREATE POLICY "update own shared_teams" ON public.shared_teams
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "delete own shared_teams" ON public.shared_teams
  FOR DELETE USING (auth.uid() = created_by);
