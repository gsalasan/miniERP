# Pipeline API Test Script
# Usage: .\test-pipeline-api.ps1

param(
    [string]$BaseUrl = "http://localhost:3002",
    [string]$Token = ""
)

if (-not $Token) {
    Write-Host "Please provide JWT token:" -ForegroundColor Yellow
    $Token = Read-Host "JWT Token"
}

# Ensure token has Bearer prefix
if (-not $Token.StartsWith("Bearer ")) {
    $Token = "Bearer $Token"
}

$Headers = @{
    "Content-Type" = "application/json"
    "Authorization" = $Token
}

Write-Host "=== Pipeline API Testing ===" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

# Test 1: GET Pipeline
Write-Host "1. Testing GET /api/v1/pipeline" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/pipeline" -Method GET -Headers $Headers
    Write-Host "✅ SUCCESS: GET Pipeline" -ForegroundColor Green
    Write-Host "Total Opportunities: $($response.data.summary.totalOpportunities)" -ForegroundColor Cyan
    Write-Host "Total Value: $($response.data.summary.totalValue) $($response.data.summary.currency)" -ForegroundColor Cyan
    
    # Show pipeline breakdown
    foreach ($status in $response.data.pipeline.PSObject.Properties) {
        $statusName = $status.Name
        $itemCount = $status.Value.items.Count
        $totalValue = $status.Value.totalValue
        Write-Host "  $statusName`: $itemCount items (Total: $totalValue)" -ForegroundColor White
    }
    
    # Store first project ID for move test
    $global:FirstProjectId = $null
    foreach ($status in $response.data.pipeline.PSObject.Properties) {
        if ($status.Value.items.Count -gt 0) {
            $global:FirstProjectId = $status.Value.items[0].id
            Write-Host "Found project for move test: $global:FirstProjectId" -ForegroundColor Magenta
            break
        }
    }
    
} catch {
    Write-Host "❌ FAILED: GET Pipeline" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        if ($_.Exception.Response.GetResponseStream()) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "2. Testing PUT /api/v1/pipeline/move" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

if ($global:FirstProjectId) {
    # Test moving a project
    $moveRequest = @{
        projectId = $global:FirstProjectId
        newStatus = "MEETING_SCHEDULED"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/pipeline/move" -Method PUT -Headers $Headers -Body $moveRequest
        Write-Host "✅ SUCCESS: Move Pipeline Card" -ForegroundColor Green
        Write-Host "Project: $($response.data.project_name)" -ForegroundColor Cyan
        Write-Host "New Status: $($response.data.status)" -ForegroundColor Cyan
        Write-Host "Message: $($response.message)" -ForegroundColor Cyan
        
    } catch {
        Write-Host "❌ FAILED: Move Pipeline Card" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "Status Code: $statusCode" -ForegroundColor Red
            
            if ($_.Exception.Response.GetResponseStream()) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "Response: $responseBody" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "⚠️  SKIPPED: No projects found for move test" -ForegroundColor Yellow
    Write-Host "To test manually, use:" -ForegroundColor White
    Write-Host 'Invoke-RestMethod -Uri "$BaseUrl/api/v1/pipeline/move" -Method PUT -Headers $Headers -Body ''{"projectId":"your-project-id","newStatus":"MEETING_SCHEDULED"}''' -ForegroundColor Gray
}

Write-Host ""
Write-Host "3. Testing Error Cases" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow

# Test invalid project ID
Write-Host "Testing invalid project ID..." -ForegroundColor White
$invalidMoveRequest = @{
    projectId = "invalid-uuid"
    newStatus = "MEETING_SCHEDULED"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/pipeline/move" -Method PUT -Headers $Headers -Body $invalidMoveRequest
    Write-Host "❌ UNEXPECTED: Should have failed with invalid project ID" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "✅ EXPECTED: Project not found (404)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  UNEXPECTED STATUS: $statusCode" -ForegroundColor Yellow
    }
}

# Test missing fields
Write-Host "Testing missing fields..." -ForegroundColor White
$missingFieldsRequest = @{
    projectId = ""
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/pipeline/move" -Method PUT -Headers $Headers -Body $missingFieldsRequest
    Write-Host "❌ UNEXPECTED: Should have failed with missing fields" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ EXPECTED: Bad Request (400)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  UNEXPECTED STATUS: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Generate and run Prisma migration for new models" -ForegroundColor White
Write-Host "2. Create sample project data for testing" -ForegroundColor White
Write-Host "3. Test with different user roles (Sales vs Manager)" -ForegroundColor White
Write-Host "4. Implement frontend Kanban board component" -ForegroundColor White