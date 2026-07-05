-- =========================================================
-- box_pokemon: ユーザーが保存する個体（BOX）
-- =========================================================
create table public.box_pokemon (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  slug       text not null,                    -- 種族（一覧フィルタ用にカラム化）
  data       jsonb not null,                   -- item/ability/gender/nature/moves/evs 等の個体設定
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint box_pokemon_data_is_object check (jsonb_typeof(data) = 'object')
);

create index box_pokemon_user_id_idx on public.box_pokemon (user_id);
create index box_pokemon_user_slug_idx on public.box_pokemon (user_id, slug);

-- =========================================================
-- teams: チーム本体
-- =========================================================
create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint teams_name_len check (char_length(name) between 1 and 100)
);

create index teams_user_id_idx on public.teams (user_id);

-- =========================================================
-- team_members: チームのスロット（0..5）→ BOX個体 の対応
--   行が無いスロット = 空き（null）として復元する
-- =========================================================
create table public.team_members (
  team_id        uuid not null references public.teams (id) on delete cascade,
  slot_index     smallint not null,
  box_pokemon_id uuid not null references public.box_pokemon (id) on delete cascade,

  primary key (team_id, slot_index),
  constraint team_members_slot_range check (slot_index between 0 and 5)
);

create index team_members_box_pokemon_id_idx on public.team_members (box_pokemon_id);

-- =========================================================
-- updated_at 自動更新
-- =========================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger box_pokemon_set_updated_at
  before update on public.box_pokemon
  for each row execute function public.set_updated_at();

create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

-- =========================================================
-- RLS: box_pokemon
-- =========================================================
alter table public.box_pokemon enable row level security;

create policy "select own box" on public.box_pokemon
  for select using (auth.uid() = user_id);
create policy "insert own box" on public.box_pokemon
  for insert with check (auth.uid() = user_id);
create policy "update own box" on public.box_pokemon
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own box" on public.box_pokemon
  for delete using (auth.uid() = user_id);

-- =========================================================
-- RLS: teams
-- =========================================================
alter table public.teams enable row level security;

create policy "select own teams" on public.teams
  for select using (auth.uid() = user_id);
create policy "insert own teams" on public.teams
  for insert with check (auth.uid() = user_id);
create policy "update own teams" on public.teams
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own teams" on public.teams
  for delete using (auth.uid() = user_id);

-- =========================================================
-- RLS: team_members
--   親チームの所有者のみ操作可。紐づけるBOX個体も本人所有であることを強制。
-- =========================================================
alter table public.team_members enable row level security;

create policy "select own team_members" on public.team_members
  for select using (
    exists (select 1 from public.teams t
            where t.id = team_id and t.user_id = auth.uid())
  );

create policy "insert own team_members" on public.team_members
  for insert with check (
    exists (select 1 from public.teams t
            where t.id = team_id and t.user_id = auth.uid())
    and exists (select 1 from public.box_pokemon b
            where b.id = box_pokemon_id and b.user_id = auth.uid())
  );

create policy "update own team_members" on public.team_members
  for update using (
    exists (select 1 from public.teams t
            where t.id = team_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.box_pokemon b
            where b.id = box_pokemon_id and b.user_id = auth.uid())
  );

create policy "delete own team_members" on public.team_members
  for delete using (
    exists (select 1 from public.teams t
            where t.id = team_id and t.user_id = auth.uid())
  );
