$body = @{
    email = "raisa@unais.com"
    password = "unais2025"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

Write-Host "Login Response:"
Write-Host "Success: $($data.success)"
Write-Host "Full data structure:"
$data | ConvertTo-Json -Depth 5
Write-Host ""

# Extract token based on actual structure
$token = $null
if ($data.token) {
    $token = $data.token
} elseif ($data.data.token) {
    $token = $data.data.token
} elseif ($data.access_token) {
    $token = $data.access_token
}

if (-not $token) {
    Write-Host "ERROR: No token found in response!"
    exit 1
}

Write-Host "Token extracted: $($token.Substring(0,50))..."
Write-Host ""

# Test /me endpoint
Write-Host "Testing /me endpoint..."
$meResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/auth/me" -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing
$meData = $meResponse.Content | ConvertFrom-Json

Write-Host "User ID: $($meData.data.id)"
Write-Host "Email: $($meData.data.email)"
Write-Host "Roles: $($meData.data.roles -join ', ')"
Write-Host ""

# Test project service
Write-Host "Testing project service /api/v1/projects..."
try {
    $projectsResponse = Invoke-WebRequest -Uri "http://localhost:4007/api/v1/projects" -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing
    $projectsData = $projectsResponse.Content | ConvertFrom-Json
    
    Write-Host "Success: $($projectsData.success)"
    Write-Host "Project count: $($projectsData.data.Count)"
    
    if ($projectsData.data.Count -gt 0) {
        Write-Host ""
        Write-Host "First project:"
        Write-Host "  ID: $($projectsData.data[0].id)"
        Write-Host "  Name: $($projectsData.data[0].project_name)"
        Write-Host "  Status: $($projectsData.data[0].status)"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}
