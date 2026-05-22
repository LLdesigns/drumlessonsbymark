-- User appearance preference (synced when logged in)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark'
  CHECK (theme_preference IN ('dark', 'light', 'system'));

COMMENT ON COLUMN public.profiles.theme_preference IS 'UI theme: dark, light, or system (follows OS)';
