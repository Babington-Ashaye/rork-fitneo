-- Deployment-time assertions for FITNEO's production security invariants.
do $$
declare
  missing_rls text;
begin
  select string_agg(format('%I.%I', namespace.nspname, class.relname), ', ')
  into missing_rls
  from pg_class class
  join pg_namespace namespace on namespace.oid = class.relnamespace
  where namespace.nspname = 'public'
    and class.relkind in ('r', 'p')
    and class.relrowsecurity = false
    and not exists (
      select 1
      from pg_depend dependency
      join pg_extension extension on extension.oid = dependency.refobjid
      where dependency.objid = class.oid
        and dependency.deptype = 'e'
    );

  if missing_rls is not null then
    raise exception 'RLS is not enabled on: %', missing_rls;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name = 'terms_accepted_at'
  ) then
    raise exception 'user_profiles.terms_accepted_at is missing';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workout_programs'
      and policyname in (
        'Authenticated users can insert own custom workouts',
        'Authenticated users can update own custom workouts',
        'Authenticated users can delete own custom workouts'
      )
      and 'authenticated' = any(roles)
  ) <> 3 then
    raise exception 'One or more custom-workout ownership policies are missing';
  end if;
end
$$;
