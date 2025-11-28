# Test Milestone CRUD Operations
# Make sure project-service is running on port 4007

$baseUrl = "http://localhost:4007/api/v1/projects"
$token = "your-jwt-token-here"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Milestone CRUD Operations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Replace with actual project ID
$projectId = "your-project-id"

# Test 1: Create Milestone
Write-Host "`n[TEST 1] Creating Milestone..." -ForegroundColor Yellow
$createBody = @{
    name = "Test Milestone"
    status = "PLANNED"
    startDate = "2025-11-25"
    endDate = "2025-12-05"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/$projectId/milestones" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $createBody
    
    Write-Host "✓ Milestone created successfully!" -ForegroundColor Green
    Write-Host "  ID: $($createResponse.data.id)" -ForegroundColor Gray
    Write-Host "  Name: $($createResponse.data.name)" -ForegroundColor Gray
    
    $milestoneId = $createResponse.data.id
    
    # Test 2: Get Milestones
    Write-Host "`n[TEST 2] Getting Milestones..." -ForegroundColor Yellow
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/$projectId/milestones" `
        -Method Get `
        -Headers @{
            "Authorization" = "Bearer $token"
        }
    
    Write-Host "✓ Retrieved $($getResponse.data.Count) milestones" -ForegroundColor Green
    
    # Test 3: Update Milestone
    Write-Host "`n[TEST 3] Updating Milestone..." -ForegroundColor Yellow
    $updateBody = @{
        name = "Updated Test Milestone"
        status = "IN_PROGRESS"
    } | ConvertTo-Json
    
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/$projectId/milestones/$milestoneId" `
        -Method Put `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $updateBody
    
    Write-Host "✓ Milestone updated successfully!" -ForegroundColor Green
    Write-Host "  New Name: $($updateResponse.data.name)" -ForegroundColor Gray
    Write-Host "  New Status: $($updateResponse.data.status)" -ForegroundColor Gray
    
    # Test 4: Delete Milestone
    Write-Host "`n[TEST 4] Deleting Milestone..." -ForegroundColor Yellow
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/$projectId/milestones/$milestoneId" `
        -Method Delete `
        -Headers @{
            "Authorization" = "Bearer $token"
        }
    
    Write-Host "✓ Milestone deleted successfully!" -ForegroundColor Green
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "All tests passed! ✓" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
