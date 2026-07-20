-- =========================================================
-- updated_at 自動更新トリガー
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER box_pokemon_set_updated_at
  BEFORE UPDATE ON public.box_pokemon
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER teams_set_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- RLS: box_pokemon
-- =========================================================
ALTER TABLE public.box_pokemon ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own box" ON public.box_pokemon
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own box" ON public.box_pokemon
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own box" ON public.box_pokemon
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own box" ON public.box_pokemon
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- RLS: teams
-- =========================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own teams" ON public.teams
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own teams" ON public.teams
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own teams" ON public.teams
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- RLS: team_members
-- =========================================================
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own team_members" ON public.team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teams t
            WHERE t.id = team_id AND t.user_id = auth.uid())
  );

CREATE POLICY "insert own team_members" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams t
            WHERE t.id = team_id AND t.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.box_pokemon b
            WHERE b.id = box_pokemon_id AND b.user_id = auth.uid())
  );

CREATE POLICY "update own team_members" ON public.team_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.teams t
            WHERE t.id = team_id AND t.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.box_pokemon b
            WHERE b.id = box_pokemon_id AND b.user_id = auth.uid())
  );

CREATE POLICY "delete own team_members" ON public.team_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.teams t
            WHERE t.id = team_id AND t.user_id = auth.uid())
  );
