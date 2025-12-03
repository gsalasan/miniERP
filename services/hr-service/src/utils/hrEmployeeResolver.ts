import type { PrismaClient } from '@prisma/client';

interface ResolveOptions {
  userId?: string;
  email?: string;
  employeeId?: string; // Direct employee ID (for dev mode)
}

interface HrEmployeeResult {
  id: string;
}

/**
 * Resolve the employee record associated with the current user.
 * Priority order:
 * 1. Direct employeeId if provided (dev mode)
 * 2. Match by userId -> users table -> employee_id -> employees
 */
export async function resolveHrEmployee(
  prisma: PrismaClient,
  { userId, email, employeeId }: ResolveOptions
): Promise<HrEmployeeResult> {
  let employeeReference: string | undefined;

  // Priority 1: Direct employee ID (for development mode)
  if (employeeId) {
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });

    if (employee) {
      return employee;
    }
  }

  // Priority 2: Lookup via userId
  if (userId) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { employee_id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    employeeReference = user.employee_id || undefined;
  }

  // Try matching by the employee reference stored on the user
  if (employeeReference) {
    const employee = await prisma.employees.findUnique({
      where: { id: employeeReference },
      select: { id: true },
    });

    if (employee) {
      return employee;
    }
  }

  throw new Error('Employee record not found for this user');
}
