# Event Bus Testing Guide

## Overview

Event Bus telah diimplementasikan dengan sukses di miniERP. Dokumentasi ini menjelaskan cara menjalankan dan menguji Event Bus.

## Arsitektur

Event Bus menggunakan pendekatan **hybrid**:
- **In-process events**: Menggunakan EventEmitter untuk komunikasi dalam satu service
- **Distributed events**: Menggunakan Redis Pub/Sub untuk komunikasi antar service

## Testing

### 1. Test In-Process Events (Tanpa Redis)

Test ini tidak memerlukan Redis dan menguji fungsi dasar Event Bus:

```bash
node test-event-bus-simple.mjs
```

**Hasil Test:**
- ✅ Test 1: In-process Event (Same Service) - PASSED
- ✅ Test 2: Multiple Subscribers (Same Service) - PASSED
- ✅ Test 3: Different Event Types - PASSED
- ✅ Test 4: Event Payload Structure - PASSED

### 2. Test Distributed Events (Dengan Redis)

Untuk menguji distributed events, pastikan Redis berjalan:

```bash
# Start Redis dengan Docker
docker-compose up -d redis

# Atau start Redis secara manual
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Jalankan test
node test-event-bus.mjs
```

Test ini akan menguji:
- Cross-service event publishing
- Multiple subscribers dari service berbeda
- Event propagation melalui Redis

## Event Types yang Diimplementasikan

### 1. Customer Events
- **`customer:created`** - Dipublish oleh CRM service saat customer dibuat
  - Subscribers: Finance Service, HR Service
  
- **`customer:updated`** - Dipublish oleh CRM service saat customer diupdate
  - Subscribers: Finance Service, HR Service

### 2. Project Events
- **`project:status:changed`** - Dipublish oleh CRM service saat project status berubah
  - Subscribers: Engineering Service, Finance Service

### 3. Estimation Events
- **`estimation:approved`** - Dipublish oleh Engineering service saat estimation disetujui
  - Subscribers: CRM Service

### 4. Invoice Events
- **`invoice:created`** - Dipublish oleh Finance service saat invoice dibuat
  - Subscribers: CRM Service

## Integrasi di Services

### CRM Service
- **File**: `services/crm-service/src/services/customerServices.ts`
  - Publish `customer:created` di `createCustomerService()`
  - Publish `customer:updated` di `updateCustomerService()`

- **File**: `services/crm-service/src/services/pipelineServices.ts`
  - Publish `project:status:changed` di `moveProjectCard()`

### Engineering Service
- **File**: `services/engineering-service/src/controllers/estimationController.ts`
  - Publish `estimation:approved` di `decideOnEstimation()`

- **File**: `services/engineering-service/src/server.ts`
  - Subscribe `project:status:changed`

### Finance Service
- **File**: `services/finance-service/src/controllers/invoices.controllers.ts`
  - Publish `invoice:created` di `createInvoice()`

- **File**: `services/finance-service/src/utils/server.ts`
  - Subscribe `customer:created`
  - Subscribe `customer:updated`
  - Subscribe `project:status:changed`

### HR Service
- **File**: `services/hr-service/src/server.ts`
  - Subscribe `customer:created`
  - Subscribe `customer:updated`

## Testing dengan Services Aktif

Untuk menguji Event Bus dengan services yang berjalan:

1. **Start Redis**:
   ```bash
   docker-compose up -d redis
   ```

2. **Start Services** (dalam terminal terpisah):
   ```bash
   # Terminal 1: CRM Service
   cd services/crm-service && npm run dev

   # Terminal 2: Finance Service
   cd services/finance-service && npm run dev

   # Terminal 3: Engineering Service
   cd services/engineering-service && npm run dev

   # Terminal 4: HR Service
   cd services/hr-service && npm run dev
   ```

3. **Test dengan API Calls**:
   ```bash
   # Create customer (akan trigger customer:created event)
   curl -X POST http://localhost:4002/api/v1/customers \
     -H "Content-Type: application/json" \
     -d '{
       "customer_name": "Test Customer",
       "channel": "ONLINE",
       "city": "Jakarta",
       "status": "ACTIVE",
       "top_days": 30
     }'

   # Check logs di Finance dan HR service untuk melihat event diterima
   ```

## Monitoring Events

### Redis CLI
```bash
# Connect ke Redis
redis-cli

# Monitor semua published messages
MONITOR

# Subscribe ke channel tertentu
SUBSCRIBE miniERP:events:customer:created
```

### Service Logs
Setiap service akan mencatat event yang diterima:
```
[Finance Service] Received customer created: customer-id - Customer Name
[HR Service] Received customer created: customer-id - Customer Name
```

## Troubleshooting

### Event tidak diterima
1. **Cek Redis connection**:
   ```bash
   redis-cli ping
   # Harus return: PONG
   ```

2. **Cek environment variable**:
   ```bash
   echo $REDIS_URL
   # Harus: redis://redis:6379 (dalam Docker) atau redis://localhost:6379 (local)
   ```

3. **Cek service logs** untuk error messages

### Redis connection error
- Pastikan Redis container berjalan: `docker ps | grep redis`
- Pastikan REDIS_URL environment variable sudah di-set
- Event Bus akan fallback ke in-process events jika Redis tidak tersedia

## Best Practices

1. **Error Handling**: Event publishing failure tidak akan mengganggu operasi utama
2. **Echo Prevention**: Service tidak memproses event yang dipublish sendiri
3. **Graceful Degradation**: Jika Redis tidak tersedia, in-process events tetap berfungsi
4. **Logging**: Semua events di-log untuk debugging

## Next Steps

1. Implement business logic di event handlers (saat ini hanya logging)
2. Add event retry mechanism untuk failed events
3. Add event versioning untuk backward compatibility
4. Add event filtering berdasarkan service roles
5. Add metrics/monitoring untuk event throughput

