### DB-fixes helper scripts

Files in this folder are helper SQL scripts to safely repair the database so Prisma migrations can be applied.

Order to run (recommended):

1. Backup the database (pg_dump or your hosting backup).
2. Run `01_add_customers_columns.sql` to add `district` and `alamat` to `customers`.
3. Inspect orphan attendances (run the SELECT queries in the notes). If you prefer to preserve attendance rows, run `02_create_placeholder_hr_employees.sql` to create placeholder employees for orphaned `employee_id` values.
4. After DB changes, mark local migration `20251110_add_customers_district` as applied:

   npx prisma migrate resolve --applied 20251110_add_customers_district

5. Run `npx prisma migrate status` and `npx prisma migrate deploy` or `npx prisma db push --accept-data-loss` as appropriate.

Important warnings:

- These scripts are provided as-is. Always backup before running.
- Placeholder employees use synthetic emails `employee_id@example.invalid`; replace with real data if available.
- The placeholder migration folders added under `prisma/migrations/` are local placeholders ONLY to align history. Replace them with original migration SQL when possible.
