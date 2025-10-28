# Procurement Service API Documentation

## Base URL

```
http://localhost:3003/api/v1
```

## Endpoints

### 1. Health Check

```
GET /health
```

Response:

```json
{
  "ok": true,
  "service": "procurement-service"
}
```

### 2. Get All Vendors

```
GET /vendors
```

Query Parameters:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by vendor name or category
- `classification` (optional): Filter by classification (SMALL, MEDIUM, LARGE, ENTERPRISE, GOVERNMENT)
- `is_preferred` (optional): Filter by preferred status (true/false)

Response:

```json
{
  "success": true,
  "message": "Vendors retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "vendor_name": "PT. Example",
      "category": "Technology",
      "classification": "LARGE",
      "is_preferred": true,
      "created_at": "2025-10-28T04:14:17.000Z",
      "updated_at": "2025-10-28T04:14:17.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 3. Get Vendor by ID

```
GET /vendors/:id
```

Response:

```json
{
  "success": true,
  "message": "Vendor retrieved successfully",
  "data": {
    "id": "uuid",
    "vendor_name": "PT. Example",
    "category": "Technology",
    "classification": "LARGE",
    "is_preferred": true,
    "created_at": "2025-10-28T04:14:17.000Z",
    "updated_at": "2025-10-28T04:14:17.000Z"
  }
}
```

### 4. Create New Vendor

```
POST /vendors
```

Request Body:

```json
{
  "vendor_name": "PT. Example Technology",
  "category": "Technology",
  "classification": "LARGE",
  "is_preferred": false
}
```

Response:

```json
{
  "success": true,
  "message": "Vendor created successfully",
  "data": {
    "id": "uuid",
    "vendor_name": "PT. Example Technology",
    "category": "Technology",
    "classification": "LARGE",
    "is_preferred": false,
    "created_at": "2025-10-28T04:14:17.000Z",
    "updated_at": "2025-10-28T04:14:17.000Z"
  }
}
```

### 5. Update Vendor

```
PUT /vendors/:id
```

Request Body (all fields optional):

```json
{
  "vendor_name": "Updated Vendor Name",
  "category": "Updated Category",
  "classification": "ENTERPRISE",
  "is_preferred": true
}
```

Response:

```json
{
  "success": true,
  "message": "Vendor updated successfully",
  "data": {
    "id": "uuid",
    "vendor_name": "Updated Vendor Name",
    "category": "Updated Category",
    "classification": "ENTERPRISE",
    "is_preferred": true,
    "created_at": "2025-10-28T04:14:17.000Z",
    "updated_at": "2025-10-28T04:14:17.000Z"
  }
}
```

### 6. Delete Vendor

```
DELETE /vendors/:id
```

Response:

```json
{
  "success": true,
  "message": "Vendor deleted successfully"
}
```

### 7. Get Vendor Statistics

```
GET /vendors/stats
```

Response:

```json
{
  "success": true,
  "message": "Vendor statistics retrieved successfully",
  "data": {
    "total": 25,
    "preferred": 8,
    "byClassification": {
      "SMALL": 5,
      "MEDIUM": 8,
      "LARGE": 7,
      "ENTERPRISE": 3,
      "GOVERNMENT": 2
    }
  }
}
```

## Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": ["vendor_name"],
      "message": "Vendor name is required"
    }
  ]
}
```

### Not Found (404)

```json
{
  "success": false,
  "message": "Vendor not found"
}
```

### Server Error (500)

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

## Vendor Classification Options

- `SMALL`: Small business
- `MEDIUM`: Medium enterprise
- `LARGE`: Large corporation
- `ENTERPRISE`: Enterprise level
- `GOVERNMENT`: Government entity
