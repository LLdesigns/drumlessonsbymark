# Pushes supabase/migrations to your REMOTE Supabase Postgres (same as: supabase link + supabase db push).
#
# Prerequisites:
#   1. Supabase CLI: npx supabase (or global supabase)
#   2. Your DATABASE password: Dashboard → Project Settings → Database → Database password (not the anon key).
#   3. The Supabase account logged in via `npx supabase login` must have access to the project, and the project must NOT be paused.
#
# Usage (PowerShell):
#   $env:SUPABASE_DB_PASSWORD = "your-database-password"
#   .\scripts\push-remote-migrations.ps1
#
# Optional:
#   $env:SUPABASE_PROJECT_REF = "cfzvnrlmbgtkltbzovte"   # defaults: env, or parsed from .env.local VITE_SUPABASE_URL
#
# After migrations, optionally run post-migration SQL in Dashboard → SQL Editor:
#   supabase/sql/after-migrations-first-user.sql  (set your email for admin role)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$ref = $env:SUPABASE_PROJECT_REF
if (-not $ref -and (Test-Path ".env.local")) {
    foreach ($line in Get-Content ".env.local") {
        if ($line -match '^\s*VITE_SUPABASE_URL\s*=\s*https://([a-z0-9]+)\.supabase\.co') {
            $ref = $Matches[1]
            break
        }
    }
}
if (-not $ref) {
    Write-Error "Set SUPABASE_PROJECT_REF or add VITE_SUPABASE_URL to .env.local"
}

$dbPass = $env:SUPABASE_DB_PASSWORD
if (-not $dbPass) {
    Write-Error "Set SUPABASE_DB_PASSWORD to your project's Database password (Settings → Database)."
}

Write-Host "Linking project ref: $ref"
npx supabase link --project-ref $ref --password $dbPass --yes

Write-Host "Pushing migrations from supabase/migrations ..."
npx supabase db push --yes

Write-Host "Done. If you need a first admin role, run supabase/sql/after-migrations-first-user.sql in SQL Editor."
