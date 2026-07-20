-- =========================================================
-- updated_at 自動更新トリガー
-- （public.set_updated_at() は 0001 で定義済みを再利用）
-- =========================================================
CREATE TRIGGER dashboards_set_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- RLS: dashboards
-- =========================================================
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own dashboards" ON public.dashboards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own dashboards" ON public.dashboards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own dashboards" ON public.dashboards
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own dashboards" ON public.dashboards
  FOR DELETE USING (auth.uid() = user_id);
