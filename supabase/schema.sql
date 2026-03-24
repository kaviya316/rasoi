-- ── PROFILES ──────────────────────────────────────────
create table profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade unique not null,
  name           text,
  city           text,
  health         text[]  default '{}',
  skill          text    default 'beginner',
  xp             integer default 0,
  level          text    default 'Chai Maker',
  streak_days    integer default 0,
  last_cooked_at timestamptz,
  onboarded      boolean default false,
  created_at     timestamptz default now()
);
alter table profiles enable row level security;
create policy "profiles_self" on profiles
  for all using (auth.uid() = user_id);

-- auto-create profile row when user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Chef'));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── SAVED RECIPES ──────────────────────────────────────
create table saved_recipes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  recipe_json  jsonb not null,
  feature      text,
  cost_inr     integer,
  cooked_count integer default 0,
  created_at   timestamptz default now()
);
alter table saved_recipes enable row level security;
create policy "saved_self" on saved_recipes
  for all using (auth.uid() = user_id);

-- ── FAMILY / GRANDMA RECIPES ───────────────────────────
create table family_recipes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  recipe_json    jsonb not null,
  original_input text,
  language       text,
  region         text,
  state          text,
  is_public      boolean default false,
  upvotes        integer default 0,
  created_at     timestamptz default now()
);
alter table family_recipes enable row level security;
create policy "family_self"   on family_recipes
  for all using (auth.uid() = user_id);
create policy "family_public" on family_recipes
  for select using (is_public = true);

-- ── FRIDGE ITEMS ───────────────────────────────────────
create table fridge_items (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users(id) on delete cascade not null,
  name      text not null,
  cooked_at timestamptz,
  added_at  timestamptz default now(),
  used      boolean default false
);
alter table fridge_items enable row level security;
create policy "fridge_self" on fridge_items
  for all using (auth.uid() = user_id);

-- ── COOK TOGETHER ROOMS ────────────────────────────────
create table cook_rooms (
  id           uuid primary key default gen_random_uuid(),
  room_code    text unique not null,
  recipe_json  jsonb not null,
  created_by   uuid references auth.users(id),
  participants jsonb default '[]',
  step         integer default 0,
  status       text default 'waiting',
  created_at   timestamptz default now()
);
alter table cook_rooms enable row level security;
create policy "rooms_creator" on cook_rooms
  for all using (auth.uid() = created_by);
create policy "rooms_participant" on cook_rooms
  for select using (
    participants @> jsonb_build_array(auth.uid()::text)
  );
alter publication supabase_realtime add table cook_rooms;

-- ── COOK HISTORY ───────────────────────────────────────
create table cook_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  recipe_name text,
  feature     text,
  xp_earned   integer default 0,
  waste_saved boolean default false,
  cooked_at   timestamptz default now()
);
alter table cook_history enable row level security;
create policy "history_self" on cook_history
  for all using (auth.uid() = user_id);

-- ── DAILY MISSIONS ─────────────────────────────────────
create table missions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  text         text not null,
  xp_reward    integer default 50,
  emoji        text,
  completed    boolean default false,
  mission_date date default current_date
);
alter table missions enable row level security;
create policy "missions_self" on missions
  for all using (auth.uid() = user_id);

-- ── BADGES ─────────────────────────────────────────────
create table badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users(id) on delete cascade not null,
  name      text not null,
  emoji     text,
  earned_at timestamptz default now()
);
alter table badges enable row level security;
create policy "badges_self" on badges
  for all using (auth.uid() = user_id);

-- ── AI RESPONSE CACHE ──────────────────────────────────
create table ai_cache (
  cache_key     text primary key,
  response_json jsonb not null,
  created_at    timestamptz default now(),
  expires_at    timestamptz default (now() + interval '12 hours')
);
alter table ai_cache enable row level security;
create policy "cache_read" on ai_cache
  for select using (auth.role() = 'authenticated');
