-- =========================================================
-- updated_at 自動更新トリガー
-- （public.set_updated_at() は 0001 で定義済みを再利用）
-- battle_record_opponents は updated_at を持たないため対象外
-- =========================================================
CREATE TRIGGER seasons_set_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER battle_records_set_updated_at
  BEFORE UPDATE ON public.battle_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- RLS: seasons
-- =========================================================
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own seasons" ON public.seasons
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own seasons" ON public.seasons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own seasons" ON public.seasons
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own seasons" ON public.seasons
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- RLS: battle_records
-- =========================================================
ALTER TABLE public.battle_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own battle_records" ON public.battle_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own battle_records" ON public.battle_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own battle_records" ON public.battle_records
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own battle_records" ON public.battle_records
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- RLS: battle_record_opponents
-- 親テーブル battle_records の user_id を参照
-- =========================================================
ALTER TABLE public.battle_record_opponents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own battle_record_opponents" ON public.battle_record_opponents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.battle_records r
            WHERE r.id = battle_record_id AND r.user_id = auth.uid())
  );

CREATE POLICY "insert own battle_record_opponents" ON public.battle_record_opponents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.battle_records r
            WHERE r.id = battle_record_id AND r.user_id = auth.uid())
  );

CREATE POLICY "update own battle_record_opponents" ON public.battle_record_opponents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.battle_records r
            WHERE r.id = battle_record_id AND r.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.battle_records r
            WHERE r.id = battle_record_id AND r.user_id = auth.uid())
  );

CREATE POLICY "delete own battle_record_opponents" ON public.battle_record_opponents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.battle_records r
            WHERE r.id = battle_record_id AND r.user_id = auth.uid())
  );
