-- Add AllowanceCategory enum type
CREATE TYPE "AllowanceCategory" AS ENUM (
  'ATTENDANCE',
  'COMMUNICATION',
  'TRANSPORTATION',
  'MEALS',
  'HOUSING',
  'POSITION'
);
