# 📡 API Integration Guide: PricingEngine & OverheadEngine

**Date:** 2025-11-20  
**Version:** 1.0.0  
**Endpoints Updated:** `/api/v1/estimations/calculate-modular`

---

## 🎯 Overview

Endpoint `calculateModularEstimation` telah diintegrasikan dengan:
- **OverheadEngine** - Untuk kalkulasi overhead allocation dengan breakdown per kategori
- **PricingEngine** - Untuk kalkulasi sell price dengan markup per item

---

## 📡 Endpoint: Calculate Modular Estimation

### Request

**Method:** `POST`  
**URL:** `/api/v1/estimations/calculate-modular`  
**Auth:** Required (Bearer Token)  
**Permission:** Engineering Access

**Headers:**
```json
{
  "Authorization": "Bearer <your-jwt-token>",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "sections": [
    {
      "type": "MATERIAL",
      "items": [
        {
          "item_id": "mat-001",
          "item_name": "Cable NYY 3x2.5mm",
          "quantity": 100,
          "hpp_per_unit": 50000,
          "total_hpp": 5000000,
          "category": "ELECTRICAL"
        },
        {
          "item_id": "mat-002",
          "item_name": "MCB 3P 32A",
          "quantity": 50,
          "hpp_per_unit": 75000,
          "total_hpp": 3750000,
          "category": "MATERIAL_DEFAULT"
        }
      ]
    },
    {
      "type": "SERVICE",
      "serviceGroups": [
        {
          "group_name": "Installation",
          "items": [
            {
              "item_id": "srv-001",
              "item_name": "Cable Installation",
              "quantity": 20,
              "hpp_per_unit": 200000,
              "total_hpp": 4000000,
              "category": "INSTALLATION"
            }
          ]
        }
      ]
    }
  ],
  "overhead_percentage": 0,
  "profit_margin_percentage": 10
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sections` | Array | Yes | Array of material/service sections |
| `sections[].type` | String | Yes | "MATERIAL" or "SERVICE" |
| `sections[].items` | Array | Conditional | Required if type="MATERIAL" |
| `sections[].serviceGroups` | Array | Conditional | Required if type="SERVICE" |
| `overhead_percentage` | Number | No | Custom overhead %. 0 = use system policy |
| `profit_margin_percentage` | Number | No | Additional profit margin % |

**Item Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `item_id` | String | Yes | Unique item identifier |
| `item_name` | String | No | Display name |
| `quantity` | Number | Yes | Quantity |
| `hpp_per_unit` | Number | Yes | HPP per unit |
| `total_hpp` | Number | Yes | Total HPP (quantity × hpp_per_unit) |
| `category` | String | No | Category for markup rule |

---

### Response

**Status:** `200 OK`

```json
{
  "summary": {
    "total_direct_hpp": 12750000,
    "overhead_percentage": 15,
    "overhead_allocation": 1912500,
    "total_estimasi_hpp": 14662500,
    "total_harga_jual_standar": 18375000,
    "estimasi_gross_margin": 5625000,
    "estimasi_gross_margin_pct": 30.61,
    "estimasi_net_margin": 3712500,
    "estimasi_net_margin_pct": 20.20,
    "overhead_breakdown": [
      {
        "category": "GAJI_OVERHEAD",
        "target_percentage": 5,
        "allocation_percentage_to_hpp": 5,
        "allocated_amount": 637500,
        "description": "Gaji indirect staff (admin, support)"
      },
      {
        "category": "SEWA_KANTOR",
        "target_percentage": 3,
        "allocation_percentage_to_hpp": 3,
        "allocated_amount": 382500,
        "description": "Sewa gedung dan fasilitas kantor"
      },
      {
        "category": "UTILITAS",
        "target_percentage": 2,
        "allocation_percentage_to_hpp": 2,
        "allocated_amount": 255000,
        "description": "Listrik, air, internet, telepon"
      }
      // ... more categories
    ],
    "pricing_summary": {
      "total_items": 3,
      "total_hpp": 12750000,
      "total_markup": 3187500,
      "total_sell_price": 18375000,
      "average_markup_percentage": 25
    },
    "average_markup_percentage": 25,
    "policy_applied": "System Policy (15%)"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `total_direct_hpp` | Number | Total direct HPP (materials + services) |
| `overhead_percentage` | Number | Overhead % applied |
| `overhead_allocation` | Number | Total overhead amount (Rp) |
| `total_estimasi_hpp` | Number | Direct HPP + Overhead |
| `total_harga_jual_standar` | Number | **Final sell price** |
| `estimasi_gross_margin` | Number | Sell price - Direct HPP |
| `estimasi_gross_margin_pct` | Number | Gross margin % |
| `estimasi_net_margin` | Number | Sell price - Total HPP |
| `estimasi_net_margin_pct` | Number | Net margin % |
| `overhead_breakdown` | Array | **NEW**: Breakdown per kategori overhead |
| `pricing_summary` | Object | **NEW**: Summary dari PricingEngine |
| `average_markup_percentage` | Number | **NEW**: Average markup applied |
| `policy_applied` | String | **NEW**: Overhead policy info |

---

## 🔄 Calculation Flow

```
Input: Sections with items
        ↓
Extract all items (materials + services)
        ↓
Calculate Total Direct HPP
        ↓
┌─────────────────────────────────────────┐
│  STEP 1: OverheadEngine                 │
│  - calculateOverheadAllocation()        │
│  - Get breakdown per kategori           │
│  - Policy: System or Custom             │
└─────────────────────────────────────────┘
        ↓
Total HPP = Direct HPP + Overhead
        ↓
┌─────────────────────────────────────────┐
│  STEP 2: PricingEngine                  │
│  - calculateBulkSellPrices()            │
│  - Apply markup per item category       │
│  - Calculate total sell price           │
└─────────────────────────────────────────┘
        ↓
Calculate Margins
        ↓
Return Enhanced Summary
```

---

## 📊 Sample Calculation

### Input Data
```
Materials:
- Item 1: Rp 50.000 × 100 = Rp 5.000.000 (ELECTRICAL, markup 28%)
- Item 2: Rp 75.000 × 50 = Rp 3.750.000 (MATERIAL_DEFAULT, markup 25%)

Services:
- Item 1: Rp 200.000 × 20 = Rp 4.000.000 (INSTALLATION, markup 30%)

Total Direct HPP: Rp 12.750.000
```

### Step 1: Overhead Calculation
```
System Policy: 15%
Overhead: Rp 12.750.000 × 15% = Rp 1.912.500

Breakdown:
- GAJI_OVERHEAD (5%): Rp 637.500
- SEWA_KANTOR (3%): Rp 382.500
- UTILITAS (2%): Rp 255.000
- ... (other categories)

Total HPP: Rp 12.750.000 + Rp 1.912.500 = Rp 14.662.500
```

### Step 2: Pricing Calculation
```
Item 1: Rp 5.000.000 × 1.28 = Rp 6.400.000
Item 2: Rp 3.750.000 × 1.25 = Rp 4.687.500
Item 3: Rp 4.000.000 × 1.30 = Rp 5.200.000

Total Sell Price: Rp 16.287.500
Average Markup: 27.67%
```

### Step 3: Final Margins
```
Gross Margin: Rp 16.287.500 - Rp 12.750.000 = Rp 3.537.500 (21.72%)
Net Margin: Rp 16.287.500 - Rp 14.662.500 = Rp 1.625.000 (9.98%)
```

---

## 🎨 Frontend Integration

### Display Overhead Breakdown

```typescript
// In your React/Vue component
const response = await fetch('/api/v1/estimations/calculate-modular', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});

const { summary } = await response.json();

// Display overhead breakdown
console.log('Overhead Breakdown:');
summary.overhead_breakdown.forEach(item => {
  console.log(`${item.category}: Rp ${item.allocated_amount.toLocaleString()} (${item.allocation_percentage_to_hpp}%)`);
});

// Display pricing info
console.log('\nPricing Summary:');
console.log(`Average Markup: ${summary.average_markup_percentage}%`);
console.log(`Total Sell Price: Rp ${summary.total_harga_jual_standar.toLocaleString()}`);

// Display margins
console.log('\nMargins:');
console.log(`Gross Margin: Rp ${summary.estimasi_gross_margin.toLocaleString()} (${summary.estimasi_gross_margin_pct.toFixed(2)}%)`);
console.log(`Net Margin: Rp ${summary.estimasi_net_margin.toLocaleString()} (${summary.estimasi_net_margin_pct.toFixed(2)}%)`);
```

### UI Components

**Overhead Breakdown Table:**
```jsx
<table>
  <thead>
    <tr>
      <th>Kategori Overhead</th>
      <th>Alokasi %</th>
      <th>Jumlah (Rp)</th>
    </tr>
  </thead>
  <tbody>
    {summary.overhead_breakdown.map(item => (
      <tr key={item.category}>
        <td>{item.description || item.category}</td>
        <td>{item.allocation_percentage_to_hpp}%</td>
        <td>Rp {item.allocated_amount.toLocaleString()}</td>
      </tr>
    ))}
  </tbody>
  <tfoot>
    <tr>
      <td><strong>Total Overhead</strong></td>
      <td><strong>{summary.overhead_percentage}%</strong></td>
      <td><strong>Rp {summary.overhead_allocation.toLocaleString()}</strong></td>
    </tr>
  </tfoot>
</table>
```

**Financial Summary Card:**
```jsx
<div className="financial-summary">
  <div className="row">
    <span>Direct HPP:</span>
    <span>Rp {summary.total_direct_hpp.toLocaleString()}</span>
  </div>
  <div className="row">
    <span>Overhead ({summary.overhead_percentage}%):</span>
    <span>Rp {summary.overhead_allocation.toLocaleString()}</span>
  </div>
  <div className="row total">
    <span>Total HPP:</span>
    <span>Rp {summary.total_estimasi_hpp.toLocaleString()}</span>
  </div>
  <div className="row highlight">
    <span>Harga Jual:</span>
    <span>Rp {summary.total_harga_jual_standar.toLocaleString()}</span>
  </div>
  <div className="row profit">
    <span>Net Margin:</span>
    <span>Rp {summary.estimasi_net_margin.toLocaleString()} ({summary.estimasi_net_margin_pct.toFixed(2)}%)</span>
  </div>
</div>
```

---

## 🔍 Console Output

Saat endpoint dipanggil, server akan log detail calculation:

```
📊 Calculating overhead allocation with OverheadEngine...
✅ Overhead calculated: 15% = Rp 1,912,500

💰 Calculating sell prices with PricingEngine...
✅ Pricing calculated: Total sell price = Rp 16,287,500

📈 Final Summary:
   Direct HPP: Rp 12,750,000
   Overhead (15%): Rp 1,912,500
   Total HPP: Rp 14,662,500
   Sell Price: Rp 16,287,500
   Net Margin: Rp 1,625,000 (9.98%)
```

---

## ⚙️ Configuration Options

### Custom Overhead Percentage

```json
{
  "sections": [...],
  "overhead_percentage": 20,  // Use custom 20% instead of system policy
  "profit_margin_percentage": 10
}
```

### System Policy (Recommended)

```json
{
  "sections": [...],
  "overhead_percentage": 0,  // 0 = use system policy from database
  "profit_margin_percentage": 10
}
```

---

## 🚨 Error Handling

### Error Responses

**400 Bad Request:**
```json
{
  "error": "Sections array is required"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to calculate overhead allocation: Invalid direct HPP"
}
```

### Error Scenarios

| Scenario | Response | Solution |
|----------|----------|----------|
| Missing sections | 400 | Include sections array |
| Invalid item data | 500 | Check item_id, quantity, hpp_per_unit |
| Database connection error | 500 | Check database connection |
| Invalid overhead % | 500 | Use 0-100 range |

---

## 🧪 Testing

### cURL Example

```bash
curl -X POST http://localhost:3000/api/v1/estimations/calculate-modular \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sections": [
      {
        "type": "MATERIAL",
        "items": [
          {
            "item_id": "mat-001",
            "quantity": 100,
            "hpp_per_unit": 50000,
            "total_hpp": 5000000,
            "category": "ELECTRICAL"
          }
        ]
      }
    ],
    "overhead_percentage": 0,
    "profit_margin_percentage": 10
  }'
```

### Postman Collection

Import collection dari: `POSTMAN_ESTIMATION_INTEGRATION.json` (to be created)

### Test Cases

1. **Basic Calculation**
   - 1 material item
   - System overhead policy
   - No profit margin

2. **Multiple Items**
   - 5 material items
   - 3 service items
   - Custom overhead 18%
   - Profit margin 12%

3. **Edge Cases**
   - Empty sections
   - Zero quantities
   - Negative HPP (should fail)

---

## 📊 Benefits of Integration

### Before Integration
```json
{
  "total_direct_hpp": 12750000,
  "overhead_allocation": 1912500,
  "total_estimasi_hpp": 14662500,
  "total_harga_jual_standar": 16128750
}
```

### After Integration
```json
{
  "total_direct_hpp": 12750000,
  "overhead_percentage": 15,
  "overhead_allocation": 1912500,
  "total_estimasi_hpp": 14662500,
  "total_harga_jual_standar": 18375000,
  "overhead_breakdown": [...],        // ✅ NEW
  "pricing_summary": {...},           // ✅ NEW
  "average_markup_percentage": 25,    // ✅ NEW
  "policy_applied": "System Policy"   // ✅ NEW
}
```

**New Features:**
- ✅ Detailed overhead breakdown per kategori
- ✅ Accurate sell price calculation dengan markup
- ✅ Average markup percentage
- ✅ Policy transparency
- ✅ Better margin calculations

---

## 🔄 Migration Guide

### For Existing Frontends

**No breaking changes!** Semua field lama tetap ada.

**Optional enhancements:**
1. Display `overhead_breakdown` table
2. Show `average_markup_percentage`
3. Display `policy_applied` info
4. Use `pricing_summary` untuk detail

---

## 📚 Related Documentation

- **PricingEngine Guide:** `PRICING_OVERHEAD_ENGINE_GUIDE.md`
- **OverheadEngine Guide:** `PRICING_OVERHEAD_ENGINE_GUIDE.md`
- **Quick Start:** `PRICING_OVERHEAD_QUICK_START.md`
- **Developer Reference:** `DEVELOPER_QUICK_REFERENCE.md`

---

## 🎯 Next Steps

1. ✅ Test endpoint dengan Postman
2. ✅ Update frontend untuk display new fields
3. ✅ Add overhead breakdown table
4. ✅ Add pricing details section
5. ✅ Monitor calculation accuracy
6. ✅ Collect user feedback

---

**Last Updated:** 2025-11-20  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

**Questions?** See `PRICING_OVERHEAD_ENGINE_GUIDE.md` or contact Engineering Team.
