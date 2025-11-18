# Fitur Generate Quotation

## Overview

Fitur ini memungkinkan user (Sales) untuk menghasilkan dokumen quotation dalam format PDF langsung dari browser berdasarkan estimasi yang sudah disetujui.

## Flow

1. User membuka detail project di CRM Pipeline
2. User membuka tab "Estimasi"
3. Jika ada estimasi dengan status "APPROVED", tombol "Generate Quotation" akan muncul
4. User klik tombol tersebut
5. Frontend memanggil backend endpoint untuk mengambil data quotation
6. Backend mengumpulkan data dari:
   - Project/Opportunity
   - Customer & Contact
   - Approved Estimation & Items
   - Sales Person
7. Backend mengirim JSON lengkap ke frontend
8. Frontend menggunakan jsPDF untuk membuat PDF
9. PDF otomatis ter-download dengan nama `Quotation-QT-YYYYMM-XXXXX.pdf`

## Backend API

### Endpoint

```
GET /api/v1/quotations/:opportunityId
```

### Headers

```
Authorization: Bearer <token>
```

### Response Success (200)

```json
{
  "success": true,
  "data": {
    "quotationNumber": "QT-202501-12345",
    "quotationDate": "2025-01-17",
    "validUntil": "2025-02-16",
    "customer": {
      "id": "uuid",
      "name": "PT. Customer Name",
      "address": "Jl. Customer Address",
      "city": "Jakarta",
      "district": "Jakarta Pusat",
      "picName": "John Doe",
      "picEmail": "john@customer.com",
      "picPhone": "+62812345678"
    },
    "opportunity": {
      "id": "uuid",
      "projectName": "Project XYZ",
      "description": "Project description",
      "status": "PROPOSAL_DELIVERED"
    },
    "salesPerson": {
      "id": "uuid",
      "name": "Sales Person Name",
      "email": "sales@company.com",
      "phone": "+62812345678"
    },
    "items": [
      {
        "id": "uuid",
        "itemName": "Product/Service Name",
        "description": "Brand - Part Number",
        "itemType": "MATERIAL",
        "quantity": 10,
        "unit": "pcs",
        "unitPrice": 1000000,
        "totalPrice": 10000000
      }
    ],
    "pricing": {
      "subtotal": 10000000,
      "discountPercentage": 0,
      "discountAmount": 0,
      "subtotalAfterDiscount": 10000000,
      "taxPercentage": 11,
      "taxAmount": 1100000,
      "grandTotal": 11100000,
      "currency": "IDR"
    },
    "terms": {
      "paymentTerms": "Net 30 days",
      "deliveryTerms": "FOB Destination",
      "warranty": "1 Year Warranty",
      "notes": "Additional notes"
    }
  }
}
```

### Response Error (422)

```json
{
  "success": false,
  "message": "No approved estimation found for this project. Please approve an estimation first."
}
```

### Response Error (404)

```json
{
  "success": false,
  "message": "Project not found"
}
```

## Frontend Implementation

### Dependencies

- `jspdf` - Library untuk generate PDF di browser

### Files Created/Modified

#### Created:

1. `services/crm-service/src/services/quotationServices.ts` - Service untuk ambil data quotation
2. `services/crm-service/src/controllers/quotationController.ts` - Controller untuk endpoint
3. `services/crm-service/src/routes/quotationRoutes.ts` - Route definition
4. `frontend/apps/crm-frontend/src/api/quotations.ts` - API client
5. `frontend/apps/crm-frontend/src/utils/pdfGenerator.ts` - PDF generator utility

#### Modified:

1. `services/crm-service/src/app.ts` - Register quotation route
2. `frontend/apps/crm-frontend/src/components/pipeline/ProjectDetailModal.tsx` - Add "Generate Quotation" button

### Usage

```typescript
import { quotationsApi } from '../api/quotations';
import { generateQuotationPDF } from '../utils/pdfGenerator';

const handleGenerateQuotation = async (projectId: string) => {
  try {
    // Fetch data from backend
    const quotationData = await quotationsApi.getQuotationData(projectId);

    // Generate PDF
    generateQuotationPDF(quotationData);
  } catch (error) {
    console.error('Failed to generate quotation:', error);
  }
};
```

## PDF Content

Generated PDF includes:

- **Header**: Quotation number, date, valid until
- **Customer Information**: Company name, address, PIC details
- **Project Information**: Project name, description
- **Items Table**: No, Description, Qty, Unit, Unit Price, Total
- **Pricing Summary**: Subtotal, Discount, Tax (11%), Grand Total
- **Terms & Conditions**: Payment terms, delivery terms, warranty, notes
- **Footer**: Sales person name, email, phone

## Business Rules

1. Quotation hanya bisa di-generate jika ada estimasi dengan status "APPROVED"
2. Quotation number format: `QT-YYYYMM-XXXXX` (derived from project number)
3. Quotation valid selama 30 hari dari tanggal pembuatan
4. Tax default: 11% (PPN)
5. Currency: IDR

## Future Enhancements

- [ ] Save quotation history to database
- [ ] Add discount field to estimation
- [ ] Support multiple currencies
- [ ] Customize quotation template
- [ ] Add company logo and branding
- [ ] Email quotation directly to customer
- [ ] Digital signature support
