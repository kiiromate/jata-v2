# Check for Docker
Write-Host "Checking for Docker..."
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH. Please install Docker Desktop."
    exit 1
}
if (!(docker info 2>$null)) {
    Write-Error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
}

# Define paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupFile = Join-Path $ScriptDir "old supabase data\db_cluster.backup"
$TempDir = Join-Path $ScriptDir "supabase\.temp"
$VersionFile = Join-Path $TempDir "postgres-version"

# Verify backup exists
if (!(Test-Path $BackupFile)) {
    Write-Error "Backup file not found at $BackupFile"
    exit 1
}

# Prepare Supabase temp directory
Write-Host "Preparing Supabase local environment..."
if (!(Test-Path $TempDir)) {
    New-Item -ItemType Directory -Force -Path $TempDir | Out-Null
}

# Set Postgres version (Required for physical backup restore)
# Using 15.6.1.115 as per standard physical backup compatibility
"15.6.1.115" | Out-File -FilePath $VersionFile -Encoding ascii -NoNewline

Write-Host "Starting Supabase with backup restoration..."
Write-Host "This may take a few minutes."

# Stop any running instance
Write-Host "Stopping any existing Supabase containers..."
supabase stop

# Start with restore
# We run this command from the 'jata' directory context
Push-Location $ScriptDir
try {
    Write-Host "Starting restoration..."
    supabase db start --from-backup "$BackupFile"
} finally {
    Pop-Location
}

if ($?) {
    Write-Host "`nRestoration complete! Your local database is running."
    Write-Host "You can now verify the data using: supabase status"
} else {
    Write-Error "`nRestoration failed. Please check the logs above."
}
