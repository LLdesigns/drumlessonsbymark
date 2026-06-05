# Prints migration names + sizes for manual MCP apply_migration calls.
# Requires Supabase MCP (user-supabase) with a reachable database (project not paused).
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$migrationsDir = Join-Path $root "supabase\migrations"
Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name | ForEach-Object {
    $name = $_.BaseName -replace '^\d+_', '' -replace '-', '_'
    Write-Host "$($_.Name) -> apply_migration name: $name ($([math]::Round($_.Length/1kb, 1)) KB)"
}
