import type { PrismaClient } from '@prisma/client';

interface ResolveOptions {
  userId?: string;
  email?: string;
}

interface HrEmployeeResult {
  id: string;
}

/**
 * Resolve the employee record associated with the current user.
 * Priority order:
 * 1. Match by userId -> users table -> employee_id -> employees
 * 2. Direct employee_id if provided
 */
export async function resolveHrEmployee(
  prisma: PrismaClient,
  { userId, email }: ResolveOptions
): Promise<HrEmployeeResult> {
  let employeeReference: string | undefined;

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
