# Seed Google Cloud SQL Database - CLI Script

This script automatically generates all Prisma schemas, runs migrations, and seeds your database to Google Cloud SQL.

## Prerequisites

- **Google Cloud SDK (gcloud CLI)** - [Install Guide](https://cloud.google.com/sdk/docs/install)
- **Node.js** v18+ and **npm**
- **Google Cloud Project** with Cloud SQL instance set up
- **Authentication** with Google Cloud (`gcloud auth login`)

## Quick Start

### 1. Set Environment Variables (Optional)

You can set these as environment variables or the script will prompt you:

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export DB_INSTANCE_NAME="minierp-db"
export DB_NAME="minierp"
export DB_USER="root"
export DB_ROOT_PASSWORD="your-password"
```

### 2. Run the Script

```bash
./seed-cloudsql.sh
```

Or with environment variables:

```bash
GCP_PROJECT_ID="your-project-id" DB_ROOT_PASSWORD="your-password" ./seed-cloudsql.sh
```

## What the Script Does

1. ✅ **Checks Prerequisites** - Verifies gcloud, node, npm are installed
2. ✅ **Authenticates** - Checks Google Cloud authentication
3. ✅ **Downloads Cloud SQL Proxy** - Automatically downloads if not found
4. ✅ **Starts Cloud SQL Proxy** - Connects to your Cloud SQL instance
5. ✅ **Installs Dependencies** - Runs `npm install`
6. ✅ **Generates Prisma Clients** - Generates clients for:
   - Root schema (`prisma/schema.prisma`)
   - Identity-service schema (`services/identity-service/prisma/schema.prisma`)
   - CRM-service schema (`services/crm-service/prisma/schema.prisma`)
7. ✅ **Resolves Failed Migrations** - Automatically fixes any failed migrations
8. ✅ **Runs Migrations** - Applies all Prisma migrations
9. ✅ **Verifies Schema** - Confirms database schema was created
10. ✅ **Seeds Database** - Runs all seed scripts:
    - `seed-users.mjs` - Creates test users
    - `seed-data.mjs` - Creates tax rates and exchange rates
    - `seed-journal-entries.mjs` - Creates journal entries and chart of accounts
    - `seed-invoices.mjs` - Creates sample invoices
11. ✅ **Verifies Seeding** - Shows counts of seeded data

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GCP_PROJECT_ID` | *prompted* | Your Google Cloud Project ID |
| `GCP_REGION` | `us-central1` | Cloud SQL instance region |
| `DB_INSTANCE_NAME` | `minierp-db` | Cloud SQL instance name |
| `DB_NAME` | `minierp` | Database name |
| `DB_USER` | `root` | Database user |
| `DB_ROOT_PASSWORD` | *prompted* | Database root password |

### Example Usage

```bash
# Basic usage (will prompt for missing values)
./seed-cloudsql.sh

# With all environment variables
GCP_PROJECT_ID="my-project" \
GCP_REGION="us-central1" \
DB_INSTANCE_NAME="minierp-db" \
DB_NAME="minierp" \
DB_USER="root" \
DB_ROOT_PASSWORD="my-secure-password" \
./seed-cloudsql.sh

# Minimal (only required values)
GCP_PROJECT_ID="my-project" \
DB_ROOT_PASSWORD="my-password" \
./seed-cloudsql.sh
```

## Troubleshooting

### Cloud SQL Proxy Issues

If the Cloud SQL Proxy fails to start:

```bash
# Check the logs
cat /tmp/cloud-sql-proxy.log

# Verify instance connection name
gcloud sql instances describe minierp-db --format="value(connectionName)"
```

### Authentication Issues

```bash
# Login to Google Cloud
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Verify authentication
gcloud auth list
```

### Database Connection Issues

1. **Verify instance exists**:
   ```bash
   gcloud sql instances list
   ```

2. **Verify database exists**:
   ```bash
   gcloud sql databases list --instance=minierp-db
   ```

3. **Check user permissions**:
   ```bash
   gcloud sql users list --instance=minierp-db
   ```

### Migration Issues

If migrations fail:

1. Check the error message in the script output
2. The script automatically attempts to resolve failed migrations
3. If needed, manually resolve:
   ```bash
   npx prisma migrate resolve --applied <migration-name> --schema=prisma/schema.prisma
   # or
   npx prisma migrate resolve --rolled-back <migration-name> --schema=prisma/schema.prisma
   ```

## Test Credentials

After seeding, you can use these credentials to login:

- **Admin Email**: `admin@minierp.com`
- **Admin Password**: `admin123`

Other users:
- **Email pattern**: `{role}@minierp.com` (e.g., `finance@minierp.com`, `hr@minierp.com`)
- **Password**: `password123`

## Cleanup

The script automatically cleans up the Cloud SQL Proxy when it exits (even on errors).

To manually stop the proxy:

```bash
# Find and kill the proxy process
pkill -f cloud-sql-proxy
```

## Advanced Usage

### Running Only Migrations (No Seeding)

Modify the script or create a wrapper that skips the seeding steps.

### Running Only Seeding (No Migrations)

Set `SKIP_MIGRATIONS=true` and modify the script to skip migration steps.

## Security Notes

⚠️ **Important**: 
- Don't commit passwords to version control
- Use environment variables or secrets management
- The script prompts for passwords securely (hidden input)
- Consider using Google Secret Manager for production

## Support

If you encounter issues:
1. Check the script output for error messages
2. Verify your Cloud SQL instance is running
3. Ensure you have proper IAM permissions
4. Check Cloud SQL Proxy logs: `/tmp/cloud-sql-proxy.log`

