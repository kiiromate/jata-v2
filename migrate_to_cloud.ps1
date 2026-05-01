param (
    [Parameter(Mandatory=$true, HelpMessage="Connection string of the new Supabase project (e.g. postgres://postgres.xxxx:pass@aws-0-region.pooler.supabase.com:5432/postgres)")]
    [string]$ConnectionString
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DumpFile = Join-Path $ScriptDir "full_dump.sql"

Write-Host "Step 1: Dumping local database..."
Write-Host "Looking for local Supabase container..."

# Check for Docker first
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not found. Please install Docker Desktop."
    exit 1
}

# Try to find the container name
$ContainerId = docker ps -q -f "name=supabase_db_" | Select-Object -First 1

if (-not $ContainerId) {
    Write-Error "Local Supabase database container not found. Is Supabase running locally? Run restore_local.ps1 first."
    exit 1
}

Write-Host "Found container: $ContainerId"
Write-Host "Generating dump to $DumpFile..."

# Use docker exec to run pg_dump inside the container
# We use cmd /c to handle redirection properly on Windows
$DumpCmd = "docker exec $ContainerId pg_dump -U postgres -d postgres --clean --if-exists --quote-all-identifiers"
cmd /c "$DumpCmd > ""$DumpFile"""

if ($LASTEXITCODE -ne 0) {
    Write-Error "Dump failed."
    exit 1
}

Write-Host "Dump created successfully."

Write-Host "Step 2: Restoring to remote project..."
Write-Host "Target: $ConnectionString"

# Check for psql
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "Using local psql..."
    cmd /c "psql ""$ConnectionString"" < ""$DumpFile"""
} else {
    Write-Host "psql not found locally. Using Docker to run psql..."
    # We use a postgres container to run psql
    # We pipe the content to avoid volume mounting complexity on Windows
    cmd /c "type ""$DumpFile"" | docker run -i --rm postgres psql ""$ConnectionString"""
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nMigration complete! Your data should now be online."
} else {
    Write-Error "`nMigration failed during restore step."
}
