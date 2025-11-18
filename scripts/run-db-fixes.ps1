<#
run-db-fixes.ps1

PowerShell helper to run the safe DB-fix SQL scripts in order.
This script assumes `psql` is available on PATH and reads connection params from the environment or prompts.

WARNING: This script will execute SQL against your database. BACKUP first.
#>

param(
  [string]$DbHost = $env:DB_HOST -or "192.168.1.72",
  [int]$DbPort = $env:DB_PORT -as [int] -or 5432,
  [string]$DbName = $env:DB_NAME -or "minierp_unais",
  [string]$DbUser = $env:DB_USER -or Read-Host "DB user",
  [string]$DbPassword = $env:DB_PASSWORD -or (Read-Host "DB password" -AsSecureString | ConvertFrom-SecureString)
)

Write-Host "*** IMPORTANT: Make sure you've BACKED UP the database before continuing."
if (-not (Read-Host "Type YES to continue") -eq 'YES') { Write-Host 'Aborting'; exit 1 }

$conn = "postgresql://$DbUser:$DbPassword@$DbHost:$DbPort/$DbName"

Write-Host "Running 01_add_customers_columns.sql"
psql $conn -f "$(Resolve-Path .)\prisma\db-fixes\01_add_customers_columns.sql"

Write-Host "(Optional) Running 02_create_placeholder_hr_employees.sql to create placeholder employees for orphan attendances"
if ((Read-Host "Create placeholder employees for orphan attendances? Type YES to run") -eq 'YES') {
  psql $conn -f "$(Resolve-Path .)\prisma\db-fixes\02_create_placeholder_hr_employees.sql"
}

Write-Host "After running these scripts, run the following commands manually in project root:"
Write-Host "  npx prisma migrate resolve --applied 20251110_add_customers_district"
Write-Host "  npx prisma migrate status"
Write-Host "  npx prisma migrate deploy    # or npx prisma db push --accept-data-loss"
