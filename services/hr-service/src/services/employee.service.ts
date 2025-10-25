import bcrypt from 'bcryptjs';

// Use relative path from root since Prisma is generated at root level
const prismaClientPath = process.env.NODE_ENV === 'production' 
  ? '@prisma/client' 
  : '../../../../node_modules/@prisma/client';

let PrismaClient: any;
let Prisma: any;

try {
  const prismaModule = require(prismaClientPath);
  PrismaClient = prismaModule.PrismaClient;
  Prisma = prismaModule.Prisma;
} catch (error) {
  console.error('Failed to load Prisma client:', error);
  throw new Error('Prisma client not available');
}

const prisma = new PrismaClient();

// Type definitions
type UserRole = 'CEO' | 'FINANCE_ADMIN' | 'SALES' | 'SALES_MANAGER' | 'PROJECT_MANAGER' | 'PROJECT_ENGINEER' | 'HR_ADMIN' | 'EMPLOYEE' | 'PROCUREMENT_ADMIN' | 'ASSET_ADMIN' | 'SYSTEM_ADMIN';

interface CreateEmployeeData {
  full_name: string;
  position: string; // harus valid positions seperti: HR Admin, Finance Admin, Project Manager, etc
  hire_date: Date | string;
  basic_salary: number | string;
  allowances?: any;
}

interface CreateUserData {
  email: string;
  password: string;
  roles: UserRole[]; // menggunakan roles array sesuai schema Prisma
}

interface CreateEmployeeWithUserRequest {
  employee: CreateEmployeeData;
  user: CreateUserData;
  email: string; // shared email for both employee and user
}

export const createEmployeeWithUser = async (data: CreateEmployeeWithUserRequest) => {
  const { employee, user, email } = data;

  try {
    // Start a Prisma transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Check if email already exists in users
      const existingUser = await tx.users.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('EMAIL_EXISTS_IN_USERS');
      }

      // 2. Hash password for user
      const password_hash = await bcrypt.hash(user.password, 10);

      // 3. Create employee record (using simple employees table)
      const createdEmployee = await tx.employees.create({
        data: {
          full_name: employee.full_name,
          position: employee.position,
          hire_date: new Date(employee.hire_date),
          basic_salary: typeof employee.basic_salary === 'string' 
            ? parseFloat(employee.basic_salary) 
            : employee.basic_salary,
          allowances: employee.allowances || {},
        }
      });

      // 4. Create user record linked to employee
      const createdUser = await tx.users.create({
        data: {
          email,
          password_hash,
          roles: user.roles.length > 0 ? user.roles : ['EMPLOYEE'], // array sesuai schema
          employee_id: createdEmployee.id, // Link to the created employee
          is_active: true,
        }
      });

      // Return both created records
      return {
        employee: createdEmployee,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          roles: createdUser.roles,
          employee_id: createdUser.employee_id,
          is_active: createdUser.is_active,
          created_at: createdUser.created_at,
          updated_at: createdUser.updated_at,
        }
      };
    });

    return result;

  } catch (error: any) {
    // Handle known errors
    if (error.message === 'EMAIL_EXISTS_IN_USERS') {
      throw new Error('Email sudah terdaftar sebagai user');
    }

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('email')) {
        throw new Error('Email sudah terdaftar');
      }
    }

    // Re-throw other errors
    console.error('Error in createEmployeeWithUser:', error);
    throw new Error('Gagal membuat employee dan user: ' + error.message);
  }
};

// Helper function to validate required fields
export const validateEmployeeUserData = (data: CreateEmployeeWithUserRequest): string[] => {
  const errors: string[] = [];
  
  // Validate employee data
  if (!data.employee?.full_name) errors.push('employee.full_name is required');
  if (!data.employee?.position) errors.push('employee.position is required');
  if (!data.employee?.hire_date) errors.push('employee.hire_date is required');
  if (!data.employee?.basic_salary) errors.push('employee.basic_salary is required');

  // Validate user data
  if (!data.user?.email) errors.push('user.email is required');
  if (!data.user?.password) errors.push('user.password is required');
  if (!data.user?.roles || !Array.isArray(data.user.roles) || data.user.roles.length === 0) {
    errors.push('user.roles is required and must be a non-empty array');
  }

  // Validate shared email
  if (!data.email) errors.push('email is required');
  
  // Validate email consistency
  if (data.email && data.user?.email && data.email !== data.user.email) {
    errors.push('email and user.email must be the same');
  }

  // Validate that roles are valid UserRole enum values
  const validRoles: UserRole[] = [
    'CEO', 'FINANCE_ADMIN', 'SALES', 'SALES_MANAGER', 'PROJECT_MANAGER', 
    'PROJECT_ENGINEER', 'HR_ADMIN', 'EMPLOYEE', 'PROCUREMENT_ADMIN', 
    'ASSET_ADMIN', 'SYSTEM_ADMIN'
  ];

  if (data.user?.roles) {
    const invalidRoles = data.user.roles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      errors.push(`Invalid roles: [${invalidRoles.join(', ')}]. Valid roles: [${validRoles.join(', ')}]`);
    }
  }

  // Position is free text (real job title), no validation needed
  // Position examples: "Manajer Keuangan", "Staff IT", "Direktur Utama", "Supervisor Gudang", etc.

  return errors;
};

// Clean up Prisma connection
export const disconnectEmployeeService = async () => {
  await prisma.$disconnect();
};

// ========== READ OPERATIONS ==========

// Get all employees with user info
export const getAllEmployees = async () => {
  try {
    const employees = await prisma.employees.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            roles: true,
            is_active: true,
            created_at: true,
            updated_at: true,
          }
        }
      }
    });

    return employees;
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    throw new Error('Gagal mengambil data employee: ' + error.message);
  }
};

// Get employee by ID with user info
export const getEmployeeById = async (employeeId: string) => {
  try {
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            roles: true,
            is_active: true,
            created_at: true,
            updated_at: true,
          }
        }
      }
    });

    return employee;
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    throw new Error('Gagal mengambil data employee: ' + error.message);
  }
};

// ========== UPDATE OPERATIONS ==========

interface UpdateEmployeeData {
  full_name?: string;
  position?: string;
  hire_date?: Date | string;
  basic_salary?: number | string;
  allowances?: any;
}

export const updateEmployee = async (employeeId: string, updateData: UpdateEmployeeData) => {
  try {
    // First check if employee exists
    const existingEmployee = await prisma.employees.findUnique({
      where: { id: employeeId }
    });

    if (!existingEmployee) {
      throw new Error('EMPLOYEE_NOT_FOUND');
    }

    // Prepare update data
    const dataToUpdate: any = {};

    if (updateData.full_name !== undefined) {
      dataToUpdate.full_name = updateData.full_name;
    }
    if (updateData.position !== undefined) {
      dataToUpdate.position = updateData.position;
    }
    if (updateData.hire_date !== undefined) {
      dataToUpdate.hire_date = new Date(updateData.hire_date);
    }
    if (updateData.basic_salary !== undefined) {
      dataToUpdate.basic_salary = typeof updateData.basic_salary === 'string'
        ? parseFloat(updateData.basic_salary)
        : updateData.basic_salary;
    }
    if (updateData.allowances !== undefined) {
      dataToUpdate.allowances = updateData.allowances;
    }

    // Update employee
    const updatedEmployee = await prisma.employees.update({
      where: { id: employeeId },
      data: dataToUpdate,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            roles: true,
            is_active: true,
            created_at: true,
            updated_at: true,
          }
        }
      }
    });

    return updatedEmployee;
  } catch (error: any) {
    if (error.message === 'EMPLOYEE_NOT_FOUND') {
      throw new Error('Employee tidak ditemukan');
    }

    console.error('Error updating employee:', error);
    throw new Error('Gagal mengupdate employee: ' + error.message);
  }
};

// Update user roles and status
interface UpdateUserData {
  roles?: UserRole[];
  is_active?: boolean;
}

export const updateEmployeeUser = async (employeeId: string, updateData: UpdateUserData) => {
  try {
    // Find user by employee_id
    const user = await prisma.users.findUnique({
      where: { employee_id: employeeId }
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Validate roles if provided
    if (updateData.roles) {
      const validRoles: UserRole[] = [
        'CEO', 'FINANCE_ADMIN', 'SALES', 'SALES_MANAGER', 'PROJECT_MANAGER',
        'PROJECT_ENGINEER', 'HR_ADMIN', 'EMPLOYEE', 'PROCUREMENT_ADMIN',
        'ASSET_ADMIN', 'SYSTEM_ADMIN'
      ];

      const invalidRoles = updateData.roles.filter(role => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        throw new Error(`Invalid roles: [${invalidRoles.join(', ')}]`);
      }

      if (updateData.roles.length === 0) {
        throw new Error('Roles array cannot be empty');
      }
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: {
        ...(updateData.roles !== undefined && { roles: updateData.roles }),
        ...(updateData.is_active !== undefined && { is_active: updateData.is_active })
      },
      select: {
        id: true,
        email: true,
        roles: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      }
    });

    return updatedUser;
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      throw new Error('User untuk employee ini tidak ditemukan');
    }

    console.error('Error updating user:', error);
    throw new Error('Gagal mengupdate user: ' + error.message);
  }
};

// ========== DELETE OPERATIONS ==========

export const deleteEmployee = async (employeeId: string) => {
  try {
    // Start transaction to delete both employee and user
    await prisma.$transaction(async (tx: any) => {
      // First delete user (if exists)
      await tx.users.deleteMany({
        where: { employee_id: employeeId }
      });

      // Then delete employee
      await tx.employees.delete({
        where: { id: employeeId }
      });
    });

    return { success: true, message: 'Employee dan user berhasil dihapus' };
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new Error('Employee tidak ditemukan');
    }

    console.error('Error deleting employee:', error);
    throw new Error('Gagal menghapus employee: ' + error.message);
  }
};