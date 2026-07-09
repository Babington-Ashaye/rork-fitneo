-- FITNEO production schema safety migration.
-- This migration is idempotent: it creates missing tables/columns/policies only,
-- and recreates functions/policies safely without dropping user data.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  onboarding_completed boolean default false,
  subscription_status text default 'free',
  trial_expires_at timestamptz,
  ai_scans_remaining integer default 0,
  ai_messages_today integer default 0,
  weekly_workout_count integer default 0,
  current_streak integer default 0,
  total_xp integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles add column if not exists email text;
alter table public.user_profiles add column if not exists display_name text;
alter table public.user_profiles add column if not exists onboarding_completed boolean default false;
alter table public.user_profiles add column if not exists subscription_status text default 'free';
alter table public.user_profiles add column if not exists trial_expires_at timestamptz;
alter table public.user_profiles add column if not exists ai_scans_remaining integer default 0;
alter table public.user_profiles add column if not exists ai_messages_today integer default 0;
alter table public.user_profiles add column if not exists weekly_workout_count integer default 0;
alter table public.user_profiles add column if not exists current_streak integer default 0;
alter table public.user_profiles add column if not exists total_xp integer default 0;
alter table public.user_profiles add column if not exists age integer;
alter table public.user_profiles add column if not exists gender text;
alter table public.user_profiles add column if not exists weight_kg numeric;
alter table public.user_profiles add column if not exists height_cm numeric;
alter table public.user_profiles add column if not exists goal_weight_kg numeric;
alter table public.user_profiles add column if not exists primary_goal text;
alter table public.user_profiles add column if not exists fitness_level text;
alter table public.user_profiles add column if not exists activity_level text;
alter table public.user_profiles add column if not exists dietary_preference text;
alter table public.user_profiles add column if not exists daily_calorie_target integer;
alter table public.user_profiles add column if not exists daily_protein_target integer;
alter table public.user_profiles add column if not exists daily_carbs_target integer;
alter table public.user_profiles add column if not exists daily_fat_target integer;
alter table public.user_profiles add column if not exists onboarding_answers jsonb default '{}'::jsonb;
alter table public.user_profiles add column if not exists last_workout_date timestamptz;
alter table public.user_profiles add column if not exists created_at timestamptz default now();
alter table public.user_profiles add column if not exists updated_at timestamptz default now();

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_name text not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  duration_seconds integer default 0,
  total_sets_completed integer default 0,
  calories_burned integer default 0,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

alter table public.workout_sessions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.workout_sessions add column if not exists session_name text;
alter table public.workout_sessions add column if not exists started_at timestamptz default now();
alter table public.workout_sessions add column if not exists completed_at timestamptz;
alter table public.workout_sessions add column if not exists duration_seconds integer default 0;
alter table public.workout_sessions add column if not exists total_sets_completed integer default 0;
alter table public.workout_sessions add column if not exists calories_burned integer default 0;
alter table public.workout_sessions add column if not exists xp_earned integer default 0;
alter table public.workout_sessions add column if not exists created_at timestamptz default now();

create table if not exists public.session_sets_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.workout_sessions(id) on delete cascade,
  exercise_name text not null,
  set_number integer not null,
  reps_completed integer default 0,
  weight_kg numeric default 0,
  created_at timestamptz default now()
);

alter table public.session_sets_log add column if not exists session_id uuid references public.workout_sessions(id) on delete cascade;
alter table public.session_sets_log add column if not exists exercise_name text;
alter table public.session_sets_log add column if not exists set_number integer;
alter table public.session_sets_log add column if not exists reps_completed integer default 0;
alter table public.session_sets_log add column if not exists weight_kg numeric default 0;
alter table public.session_sets_log add column if not exists created_at timestamptz default now();

create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  meal_type text not null,
  food_name text not null,
  serving_size text,
  calories integer default 0,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fat_g numeric default 0,
  scan_method text default 'manual',
  created_at timestamptz default now()
);

alter table public.nutrition_logs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.nutrition_logs add column if not exists log_date date default current_date;
alter table public.nutrition_logs add column if not exists meal_type text;
alter table public.nutrition_logs add column if not exists food_name text;
alter table public.nutrition_logs add column if not exists serving_size text;
alter table public.nutrition_logs add column if not exists calories integer default 0;
alter table public.nutrition_logs add column if not exists protein_g numeric default 0;
alter table public.nutrition_logs add column if not exists carbs_g numeric default 0;
alter table public.nutrition_logs add column if not exists fat_g numeric default 0;
alter table public.nutrition_logs add column if not exists scan_method text default 'manual';
alter table public.nutrition_logs add column if not exists created_at timestamptz default now();

create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric,
  recorded_date date default current_date,
  created_at timestamptz default now()
);

alter table public.body_metrics add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.body_metrics add column if not exists weight_kg numeric;
alter table public.body_metrics add column if not exists recorded_date date default current_date;
alter table public.body_metrics add column if not exists created_at timestamptz default now();

create table if not exists public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null default 0,
  reason text,
  created_at timestamptz default now()
);

alter table public.xp_transactions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.xp_transactions add column if not exists amount integer default 0;
alter table public.xp_transactions add column if not exists reason text;
alter table public.xp_transactions add column if not exists created_at timestamptz default now();

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  badge_name text,
  earned_at timestamptz default now(),
  unique (user_id, badge_id)
);

alter table public.badges add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.badges add column if not exists badge_id text;
alter table public.badges add column if not exists badge_name text;
alter table public.badges add column if not exists earned_at timestamptz default now();

create table if not exists public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  program_name text not null,
  category text default 'strength',
  difficulty integer default 1,
  duration_minutes integer default 30,
  description text,
  exercise_ids text[] default array[]::text[],
  is_premium boolean default false,
  is_template boolean default true,
  calories integer,
  exercise_count integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.workout_programs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.workout_programs add column if not exists program_name text;
alter table public.workout_programs add column if not exists category text default 'strength';
alter table public.workout_programs add column if not exists difficulty integer default 1;
alter table public.workout_programs add column if not exists duration_minutes integer default 30;
alter table public.workout_programs add column if not exists description text;
alter table public.workout_programs add column if not exists exercise_ids text[] default array[]::text[];
alter table public.workout_programs add column if not exists is_premium boolean default false;
alter table public.workout_programs add column if not exists is_template boolean default true;
alter table public.workout_programs add column if not exists calories integer;
alter table public.workout_programs add column if not exists exercise_count integer;
alter table public.workout_programs add column if not exists created_at timestamptz default now();
alter table public.workout_programs add column if not exists updated_at timestamptz default now();

create table if not exists public.leaderboard_entries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_color text default '#0A84FF',
  total_xp integer default 0,
  current_streak integer default 0,
  workouts_this_week integer default 0,
  last_updated timestamptz default now()
);

alter table public.leaderboard_entries add column if not exists display_name text;
alter table public.leaderboard_entries add column if not exists avatar_color text default '#0A84FF';
alter table public.leaderboard_entries add column if not exists total_xp integer default 0;
alter table public.leaderboard_entries add column if not exists current_streak integer default 0;
alter table public.leaderboard_entries add column if not exists workouts_this_week integer default 0;
alter table public.leaderboard_entries add column if not exists last_updated timestamptz default now();

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'FITNEO Chat',
  created_at timestamptz default now()
);

alter table public.chat_sessions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.chat_sessions add column if not exists title text default 'FITNEO Chat';
alter table public.chat_sessions add column if not exists created_at timestamptz default now();

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.chat_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.chat_messages add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.chat_messages add column if not exists session_id uuid references public.chat_sessions(id) on delete cascade;
alter table public.chat_messages add column if not exists role text;
alter table public.chat_messages add column if not exists content text;
alter table public.chat_messages add column if not exists created_at timestamptz default now();

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  started_at timestamptz default now(),
  expires_at timestamptz,
  provider text,
  provider_customer_id text,
  provider_entitlement_id text,
  updated_at timestamptz default now()
);

alter table public.subscriptions add column if not exists plan text default 'free';
alter table public.subscriptions add column if not exists status text default 'inactive';
alter table public.subscriptions add column if not exists started_at timestamptz default now();
alter table public.subscriptions add column if not exists expires_at timestamptz;
alter table public.subscriptions add column if not exists provider text;
alter table public.subscriptions add column if not exists provider_customer_id text;
alter table public.subscriptions add column if not exists provider_entitlement_id text;
alter table public.subscriptions add column if not exists updated_at timestamptz default now();

create index if not exists idx_workout_sessions_user_completed on public.workout_sessions(user_id, completed_at desc);
create index if not exists idx_nutrition_logs_user_date on public.nutrition_logs(user_id, log_date desc);
create index if not exists idx_xp_transactions_user_created on public.xp_transactions(user_id, created_at desc);
create index if not exists idx_body_metrics_user_date on public.body_metrics(user_id, recorded_date desc);
create index if not exists idx_chat_messages_session_created on public.chat_messages(session_id, created_at asc);

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_workout_programs_updated_at on public.workout_programs;
create trigger set_workout_programs_updated_at
before update on public.workout_programs
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_sets_log enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.body_metrics enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.badges enable row level security;
alter table public.workout_programs enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile" on public.user_profiles for select using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile" on public.user_profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile" on public.user_profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can manage own workout sessions" on public.workout_sessions;
create policy "Users can manage own workout sessions" on public.workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own nutrition logs" on public.nutrition_logs;
create policy "Users can manage own nutrition logs" on public.nutrition_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own body metrics" on public.body_metrics;
create policy "Users can manage own body metrics" on public.body_metrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own xp transactions" on public.xp_transactions;
create policy "Users can manage own xp transactions" on public.xp_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own badges" on public.badges;
create policy "Users can manage own badges" on public.badges for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read templates and own workout programs" on public.workout_programs;
create policy "Users can read templates and own workout programs" on public.workout_programs for select using (is_template = true or auth.uid() = user_id);
drop policy if exists "Users can manage own workout programs" on public.workout_programs;
create policy "Users can manage own workout programs" on public.workout_programs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read leaderboard" on public.leaderboard_entries;
create policy "Users can read leaderboard" on public.leaderboard_entries for select using (true);
drop policy if exists "Users can upsert own leaderboard" on public.leaderboard_entries;
create policy "Users can upsert own leaderboard" on public.leaderboard_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own chat sessions" on public.chat_sessions;
create policy "Users can manage own chat sessions" on public.chat_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own chat messages" on public.chat_messages;
create policy "Users can manage own chat messages" on public.chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription" on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists "Users can manage sets through own sessions" on public.session_sets_log;
create policy "Users can manage sets through own sessions" on public.session_sets_log
for all using (
  exists (
    select 1 from public.workout_sessions ws
    where ws.id = session_sets_log.session_id
      and ws.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.workout_sessions ws
    where ws.id = session_sets_log.session_id
      and ws.user_id = auth.uid()
  )
);
