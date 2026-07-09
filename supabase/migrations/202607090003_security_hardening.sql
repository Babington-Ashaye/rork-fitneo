-- FITNEO production security hardening.
-- Enables RLS on every application-owned public table and makes custom workout
-- ownership checks explicit for every write operation.

do $$
declare
  target record;
begin
  for target in
    select namespace.nspname as schema_name, class.relname as table_name
    from pg_class class
    join pg_namespace namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relkind in ('r', 'p')
      and not exists (
        select 1
        from pg_depend dependency
        join pg_extension extension on extension.oid = dependency.refobjid
        where dependency.objid = class.oid
          and dependency.deptype = 'e'
      )
  loop
    execute format(
      'alter table %I.%I enable row level security',
      target.schema_name,
      target.table_name
    );
  end loop;
end
$$;

alter table if exists public.user_profiles
  add column if not exists terms_accepted_at timestamptz;

alter table if exists public.exercise_library enable row level security;
drop policy if exists "Exercise library is readable" on public.exercise_library;
create policy "Authenticated users can read exercise library"
on public.exercise_library
for select
to authenticated
using (true);

alter table if exists public.workout_programs enable row level security;
create index if not exists idx_workout_programs_user_id
on public.workout_programs(user_id);

drop policy if exists "Users can read templates and own workout programs" on public.workout_programs;
drop policy if exists "Users can manage own workout programs" on public.workout_programs;
drop policy if exists "Authenticated users can read workout templates and own programs" on public.workout_programs;
drop policy if exists "Authenticated users can insert own custom workouts" on public.workout_programs;
drop policy if exists "Authenticated users can update own custom workouts" on public.workout_programs;
drop policy if exists "Authenticated users can delete own custom workouts" on public.workout_programs;

create policy "Authenticated users can read workout templates and own programs"
on public.workout_programs
for select
to authenticated
using (
  coalesce(is_template, false) = true
  or user_id = (select auth.uid())
);

create policy "Authenticated users can insert own custom workouts"
on public.workout_programs
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and coalesce(is_template, false) = false
);

create policy "Authenticated users can update own custom workouts"
on public.workout_programs
for update
to authenticated
using (
  user_id = (select auth.uid())
  and coalesce(is_template, false) = false
)
with check (
  user_id = (select auth.uid())
  and coalesce(is_template, false) = false
);

create policy "Authenticated users can delete own custom workouts"
on public.workout_programs
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and coalesce(is_template, false) = false
);
