param(
  [string]$BaseUrl = "http://localhost:4003"
)

Write-Host "Seeding Finance Service at $BaseUrl" -ForegroundColor Cyan

function Invoke-PostJson {
  param(
    [string]$Url,
    [hashtable]$Body
  )
  try {
    $json = $Body | ConvertTo-Json -Depth 6
    return Invoke-RestMethod -Uri $Url -Method Post -Body $json -ContentType 'application/json'
  } catch {
    Write-Host "WARN: POST $Url -> $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

# ---- Seed Pricing Rules ----
$pricingRules = @(
  @{ category = "MATERIAL_DEFAULT"; markup_percentage = 25 },
  @{ category = "SERVICE_DEFAULT";  markup_percentage = 30 },
  @{ category = "GENERAL";          markup_percentage = 22 },
  @{ category = "HARDWARE";         markup_percentage = 20 },
  @{ category = "SOFTWARE";         markup_percentage = 25 },
  @{ category = "INSTALLATION";     markup_percentage = 30 }
)

foreach ($rule in $pricingRules) {
  Invoke-PostJson -Url "$BaseUrl/api/pricing-rules" -Body $rule | Out-Null
}

# ---- Seed Overhead Allocations (total ~15%) ----
$overheadPolicies = @(
  @{ cost_category = "GAJI_OVERHEAD";   target_percentage = 6;   allocation_percentage_to_hpp = 6 },
  @{ cost_category = "SEWA_KANTOR";    target_percentage = 2.5; allocation_percentage_to_hpp = 2.5 },
  @{ cost_category = "UTILITAS";       target_percentage = 1.5; allocation_percentage_to_hpp = 1.5 },
  @{ cost_category = "DEPRESIASI";     target_percentage = 1.5; allocation_percentage_to_hpp = 1.5 },
  @{ cost_category = "ADMINISTRASI";   target_percentage = 1.5; allocation_percentage_to_hpp = 1.5 },
  @{ cost_category = "PEMELIHARAAN";  target_percentage = 1.5; allocation_percentage_to_hpp = 1.5 },
  @{ cost_category = "MARKETING";     target_percentage = 0.8; allocation_percentage_to_hpp = 0.8 },
  @{ cost_category = "ASURANSI";      target_percentage = 0.7; allocation_percentage_to_hpp = 0.7 }
)

foreach ($p in $overheadPolicies) {
  Invoke-PostJson -Url "$BaseUrl/api/overhead-allocations" -Body $p | Out-Null
}

Write-Host "✅ Seed complete. You can now refresh the frontend." -ForegroundColor Green
