# Invoice API Testing Script
# PowerShell script untuk quick testing Invoice CRUD operations

$baseUrl = "http://localhost:3001/api/invoices"

Write-Host "=== INVOICE API TESTING ===" -ForegroundColor Green
Write-Host ""

# 1. GET All Invoices
Write-Host "1. GET All Invoices:" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri $baseUrl -Method GET
    Write-Host "Success - Total invoices: $($result.data.Count)" -ForegroundColor Green
    $result.data | Format-Table invoice_number, customer_name, total_amount, status -AutoSize
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""

# 2. Filter by Status
Write-Host "2. Filter by Status (DRAFT):" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl?status=DRAFT" -Method GET
    Write-Host "Success - DRAFT invoices: $($result.data.Count)" -ForegroundColor Green
    $result.data | Format-Table invoice_number, customer_name, status -AutoSize
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""

# 3. Search by Customer Name
Write-Host "3. Search by Customer Name (PT):" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl?customer_name=PT" -Method GET
    Write-Host "Success - Found: $($result.data.Count)" -ForegroundColor Green
    $result.data | Format-Table invoice_number, customer_name -AutoSize
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""

# 4. CREATE New Invoice
Write-Host "4. CREATE New Invoice:" -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$createBody = @{
    invoice_number = "INV-TEST-$timestamp"
    invoice_date = (Get-Date).ToString("yyyy-MM-dd")
    due_date = (Get-Date).AddDays(14).ToString("yyyy-MM-dd")
    customer_name = "Test Customer $timestamp"
    customer_address = "Jl. Testing No. 123"
    customer_phone = "021-99999999"
    customer_email = "test@example.com"
    subtotal = 5000000
    tax_amount = 550000
    discount_amount = 100000
    total_amount = 5450000
    currency = "IDR"
    status = "DRAFT"
    notes = "Test invoice created by PowerShell script"
    payment_terms = "Net 14"
    created_by = "test_user"
} | ConvertTo-Json

try {
    $newInvoice = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $createBody -ContentType "application/json"
    Write-Host "Success - Created invoice: $($newInvoice.data.invoice_number)" -ForegroundColor Green
    Write-Host "  ID: $($newInvoice.data.id)" -ForegroundColor Cyan
    Write-Host "  Customer: $($newInvoice.data.customer_name)" -ForegroundColor Cyan
    Write-Host "  Total: $($newInvoice.data.total_amount)" -ForegroundColor Cyan
    $createdId = $newInvoice.data.id
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    $createdId = $null
}

Write-Host ""

# 5. GET by ID
if ($createdId) {
    Write-Host "5. GET Invoice by ID:" -ForegroundColor Yellow
    try {
        $invoice = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method GET
        Write-Host "Success - Retrieved invoice: $($invoice.data.invoice_number)" -ForegroundColor Green
        Write-Host "  Status: $($invoice.data.status)" -ForegroundColor Cyan
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }

    Write-Host ""

    # 6. UPDATE Invoice
    Write-Host "6. UPDATE Invoice (Change status to SENT):" -ForegroundColor Yellow
    $updateBody = @{
        status = "SENT"
        notes = "Invoice sent to customer - Updated by test script"
        updated_by = "test_user"
    } | ConvertTo-Json

    try {
        $updated = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method PUT -Body $updateBody -ContentType "application/json"
        Write-Host "Success - Updated invoice status: $($updated.data.status)" -ForegroundColor Green
        Write-Host "  Notes: $($updated.data.notes)" -ForegroundColor Cyan
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }

    Write-Host ""

    # 7. DELETE Invoice
    Write-Host "7. DELETE Invoice (ID: $createdId)" -ForegroundColor Yellow
    try {
        $deleted = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method DELETE
        Write-Host "Success - Invoice deleted" -ForegroundColor Green
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== TESTING COMPLETE ===" -ForegroundColor Green

