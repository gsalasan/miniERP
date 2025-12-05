import type { PrismaClient, Prisma } from '@prisma/client';

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
 * 3. Fallback: match by email (company or personal) and auto-link the user
 */
export async function resolveHrEmployee(
  prisma: PrismaClient,
  { userId, email, employeeId }: ResolveOptions
): Promise<HrEmployeeResult> {
  let employeeReference: string | undefined;
  let candidateEmail = email?.toLowerCase();
  let userRecord:
    | { id: string; email: string | null; employee_id: string | null }
    | null = null;

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
    userRecord = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, employee_id: true },
    });

    if (!userRecord) {
      throw new Error('User not found');
    }

    employeeReference = userRecord.employee_id || undefined;
    if (!candidateEmail && userRecord.email) {
      candidateEmail = userRecord.email.toLowerCase();
    }
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

  // Priority 3: Link by email (either corporate or personal)
  if (candidateEmail) {
    const emailFilter = { equals: candidateEmail, mode: 'insensitive' } as const;
    const emailMatchFilters: Prisma.employeesWhereInput[] = [
      { email: emailFilter } as Prisma.employeesWhereInput,
      { personal_email: emailFilter } as Prisma.employeesWhereInput,
    ];
    const fallbackEmployee = await prisma.employees.findFirst({
      where: {
        OR: emailMatchFilters,
      },
      select: { id: true },
    });

    if (fallbackEmployee) {
      // Auto-link the user for next requests if possible
      if (userRecord && !userRecord.employee_id) {
        await prisma.users.update({
          where: { id: userRecord.id },
          data: { employee_id: fallbackEmployee.id },
        }).catch((err) => {
          console.warn('[HR] Failed to auto-link user to employee:', err.message);
        });
      }

      return fallbackEmployee;
    }
  }

  throw new Error('Employee record not found for this user');
}
