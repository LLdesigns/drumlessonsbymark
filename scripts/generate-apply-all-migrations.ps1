# Regenerates supabase/sql/apply-all-migrations-once.sql from supabase/migrations/*.sql (sorted by filename).
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$migrationsDir = Join-Path $root "supabase\migrations"
$outFile = Join-Path $root "supabase\sql\apply-all-migrations-once.sql"

$files = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name
if ($files.Count -eq 0) {
    Write-Error "No migration files in $migrationsDir"
}

$header = @"
-- ONE-TIME: Run in Supabase Dashboard -> SQL Editor on an EMPTY project (or after reset).
-- Creates schema from all files in supabase/migrations/ (sorted by filename).
-- If tables already exist, expect errors on CREATE — use supabase db push for incremental updates instead.
-- Regenerated: $(Get-Date -Format o)

"@

$sb = [System.Text.StringBuilder]::new()
[void]$sb.Append($header)

foreach ($file in $files) {
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("-- ========== $($file.Name) ==========")
    [void]$sb.AppendLine("")
    $content = Get-Content -Raw -Path $file.FullName
    if ($null -eq $content) { $content = "" }
    [void]$sb.Append($content)
    if (-not $content.EndsWith("`n")) {
        [void]$sb.AppendLine("")
    }
}

Set-Content -Path $outFile -Value $sb.ToString() -NoNewline -Encoding utf8
Write-Host "Wrote $($files.Count) migrations to $outFile"
