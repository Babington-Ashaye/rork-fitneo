-- Repair FITNEO auth sign-up profile creation.
-- Supabase Auth returns "Database error saving new user" when an auth.users
-- trigger throws. This trigger is intentionally defensive: profile creation
-- should never block the core auth user from being created.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    id,
    email,
    display_name,
    onboarding_completed,
    subscription_status,
    trial_expires_at,
    ai_scans_remaining,
    ai_messages_today,
    weekly_workout_count,
    current_streak,
    total_xp
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'Athlete'
    ),
    false,
    'free',
    now() + interval '30 days',
    3,
    0,
    0,
    0,
    0
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.user_profiles.display_name, excluded.display_name),
    updated_at = now();

  return new;
exception
  when others then
    raise warning 'FITNEO handle_new_user failed for auth user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Remove common broken trigger names before installing the safe one.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists handle_new_user on auth.users;
drop trigger if exists create_profile_for_new_user on auth.users;
drop trigger if exists create_user_profile on auth.users;
drop trigger if exists on_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

grant execute on function public.handle_new_user() to service_role;
