CREATE TABLE IF NOT EXISTS public.ai_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_data jsonb,
  generated_at timestamptz DEFAULT now(),
  sport text,
  position text,
  level text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_plans
  ADD COLUMN IF NOT EXISTS plan_data jsonb,
  ADD COLUMN IF NOT EXISTS generated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS sport text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS ai_plans_user_id_unique
  ON public.ai_plans(user_id);

ALTER TABLE public.ai_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_plans'
      AND policyname = 'Users can read their own AI plans'
  ) THEN
    CREATE POLICY "Users can read their own AI plans"
      ON public.ai_plans
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_plans'
      AND policyname = 'Users can insert their own AI plans'
  ) THEN
    CREATE POLICY "Users can insert their own AI plans"
      ON public.ai_plans
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_plans'
      AND policyname = 'Users can update their own AI plans'
  ) THEN
    CREATE POLICY "Users can update their own AI plans"
      ON public.ai_plans
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
