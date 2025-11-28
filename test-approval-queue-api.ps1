# Test Approval Queue API Endpoint
Write-Host ""
Write-Host "===== Testing Approval Queue API =====" -ForegroundColor Cyan

# 1. Get CEO token
Write-Host ""
Write-Host "1. Logging in as CEO..." -ForegroundColor Yellow
$loginBody = @{
    email = "ceo@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$token = $loginResponse.token
Write-Host "Success: CEO token obtained" -ForegroundColor Green

# 2. Get approval queue
Write-Host ""
Write-Host "2. Fetching approval queue..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $approvalQueue = Invoke-RestMethod -Uri "http://localhost:4001/api/v1/estimations/approval-queue" `
        -Method GET `
        -Headers $headers
    
    Write-Host "Success: Approval queue retrieved" -ForegroundColor Green
    Write-Host ""
    Write-Host "Approval Queue Summary:" -ForegroundColor Cyan
    Write-Host "Total PENDING_APPROVAL estimations: $($approvalQueue.Count)" -ForegroundColor White
    
    if ($approvalQueue.Count -gt 0) {
        Write-Host ""
        Write-Host "Pending Approvals:" -ForegroundColor Cyan
        foreach ($est in $approvalQueue) {
            $projectName = $est.project.project_name
            $customerName = $est.project.customer.customer_name
            $requestedBy = $est.requested_by.employee.full_name
            $submittedDate = $est.submitted_at
            $totalCost = [math]::Round($est.total_cost, 2)
            
            Write-Host "  - ID: $($est.id) - $projectName" -ForegroundColor White
            Write-Host "    Customer: $customerName" -ForegroundColor Gray
            Write-Host "    Requested by: $requestedBy" -ForegroundColor Gray
            Write-Host "    Submitted: $submittedDate" -ForegroundColor Gray
            Write-Host "    Total Cost: IDR $totalCost" -ForegroundColor Green
        }
    } else {
        Write-Host ""
        Write-Host "No pending approvals found." -ForegroundColor Yellow
        Write-Host "To test the approval flow:" -ForegroundColor White
        Write-Host "1. Create an estimation as SALES" -ForegroundColor Gray
        Write-Host "2. Assign to PE as PM" -ForegroundColor Gray
        Write-Host "3. Calculate and submit as PE" -ForegroundColor Gray
        Write-Host "4. Status will change to PENDING_APPROVAL" -ForegroundColor Gray
        Write-Host "5. It will appear in this approval queue" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "Error fetching approval queue" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# 3. Get work queue for comparison
Write-Host ""
Write-Host "3. Fetching work queue for comparison..." -ForegroundColor Yellow
try {
    $workQueue = Invoke-RestMethod -Uri "http://localhost:4001/api/v1/estimations/queue" `
        -Method GET `
        -Headers $headers
    
    Write-Host "Success: Work queue retrieved" -ForegroundColor Green
    Write-Host "Total work items: $($workQueue.Count)" -ForegroundColor White
    
} catch {
    Write-Host "Error fetching work queue" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "===== Test Complete =====" -ForegroundColor Cyan
Write-Host ""
