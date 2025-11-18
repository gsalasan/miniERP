import bcrypt from 'bcryptjs';
import { getPrisma } from '../utils/prisma';
// Use local enum types temporarily until Prisma client generation is fixed
import { Gender, MaritalStatus, BloodType, EmploymentType, EmployeeStatus, EducationLevel } from '../types/prisma.enums';

const prisma = getPrisma();

// Type definitions
type UserRole = 'CEO' | 'FINANCE_ADMIN' | 'SALES' | 'SALES_MANAGER' | 'PROJECT_MANAGER' | 'PROJECT_ENGINEER' | 'HR_ADMIN' | 'EMPLOYEE' | 'PROCUREMENT_ADMIN' | 'ASSET_ADMIN' | 'SYSTEM_ADMIN';

interface CreateEmployeeData {
  full_name: string;
  position: string; // harus valid positions seperti: HR Admin, Finance Admin, Project Manager, etc
  department?: string;
  hire_date: Date | string;
  basic_salary: number | string;
  allowances?: any;
  // Optional extended fields
  department?: string;
  gender?: string;
  marital_status?: string;
  blood_type?: string;
  employment_type?: string;
  status?: string;
  education_level?: string;
  bank_name?: string;
  bank_account_number?: string;
  npwp?: string;
  ptkp?: string;
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
      const employeeCreateData: any = {
        full_name: employee.full_name,
        position: employee.position,
        hire_date: new Date(employee.hire_date),
        basic_salary: typeof employee.basic_salary === 'string' 
          ? parseFloat(employee.basic_salary) 
          : employee.basic_salary,
        allowances: employee.allowances || {},
      };

      // Add optional fields if provided
      if (employee.department) employeeCreateData.department = employee.department;
      if (employee.gender) employeeCreateData.gender = employee.gender;
      if (employee.marital_status) employeeCreateData.marital_status = employee.marital_status;
      if (employee.blood_type) employeeCreateData.blood_type = employee.blood_type;
      if (employee.employment_type) employeeCreateData.employment_type = employee.employment_type;
      if (employee.status) employeeCreateData.status = employee.status;
      if (employee.education_level) employeeCreateData.education_level = employee.education_level;
      if (employee.bank_name) employeeCreateData.bank_name = employee.bank_name;
      if (employee.bank_account_number) employeeCreateData.bank_account_number = employee.bank_account_number;
      if (employee.npwp) employeeCreateData.npwp = employee.npwp;
      if (employee.ptkp) employeeCreateData.ptkp = employee.ptkp;

      const createdEmployee = await tx.employees.create({
        data: employeeCreateData
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
  
  // Small helpers
  const isValidEmail = (e: string) => /.+@.+\..+/.test(e);
  const isValidDateStr = (d: any) => {
    if (typeof d !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    const t = Date.parse(d);
    return !Number.isNaN(t);
  };
  const isValidMoney = (v: any) => {
    if (v === null || v === undefined) return false;
    let s = v;
    if (typeof s === 'string') s = s.replace(/\./g, '').replace(/,/g, '.');
    return !Number.isNaN(Number(s));
  };
  
  // Validate employee data
  if (!data.employee?.full_name) errors.push('employee.full_name is required');
  if (!data.employee?.position) errors.push('employee.position is required');
  if (!data.employee?.hire_date) errors.push('employee.hire_date is required');
  if (!data.employee?.basic_salary) errors.push('employee.basic_salary is required');

  // Validate formats for some employee fields
  if (data.employee?.hire_date && !isValidDateStr(data.employee.hire_date as any)) {
    errors.push('employee.hire_date must be a valid date string in format YYYY-MM-DD');
  }
  if (data.employee?.basic_salary !== undefined && !isValidMoney(data.employee.basic_salary)) {
    errors.push('employee.basic_salary must be a valid number');
  }

  // Validate enum values if provided
  const validGenders = ['MALE', 'FEMALE', 'OTHER'];
  if (data.employee?.gender && !validGenders.includes(data.employee.gender)) {
    errors.push(`employee.gender must be one of: ${validGenders.join(', ')}`);
  }

  const validMaritalStatuses = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
  if (data.employee?.marital_status && !validMaritalStatuses.includes(data.employee.marital_status)) {
    errors.push(`employee.marital_status must be one of: ${validMaritalStatuses.join(', ')}`);
  }

  const validBloodTypes = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'];
  if (data.employee?.blood_type && !validBloodTypes.includes(data.employee.blood_type)) {
    errors.push(`employee.blood_type must be one of: ${validBloodTypes.join(', ')}`);
  }

  const validEmploymentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE'];
  if (data.employee?.employment_type && !validEmploymentTypes.includes(data.employee.employment_type)) {
    errors.push(`employee.employment_type must be one of: ${validEmploymentTypes.join(', ')}`);
  }

  const validEmployeeStatuses = ['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION'];
  if (data.employee?.status && !validEmployeeStatuses.includes(data.employee.status)) {
    errors.push(`employee.status must be one of: ${validEmployeeStatuses.join(', ')}`);
  }

  const validEducationLevels = ['HIGH_SCHOOL', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE'];
  if (data.employee?.education_level && !validEducationLevels.includes(data.employee.education_level)) {
    errors.push(`employee.education_level must be one of: ${validEducationLevels.join(', ')}`);
  }

  // Validate user data
  if (!data.user?.email) errors.push('user.email is required');
  if (!data.user?.password) errors.push('user.password is required');
  if (!data.user?.roles || !Array.isArray(data.user.roles) || data.user.roles.length === 0) {
    errors.push('user.roles is required and must be a non-empty array');
  }

  // Validate email formats
  if (data.user?.email && !isValidEmail(data.user.email)) {
    errors.push('user.email must be a valid email');
  }

  // Validate shared email
  if (!data.email) errors.push('email is required');
  if (data.email && !isValidEmail(data.email)) {
    errors.push('email must be a valid email');
  }
  
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
    // Try legacy `employees` table first (this is where your 6 rows usually live)
    let legacy: any[] = [];
    try {
      legacy = await prisma.employees.findMany({
        select: {
          id: true,
          full_name: true,
          position: true,
          department: true,
          gender: true,
          marital_status: true,
          blood_type: true,
          employment_type: true,
          status: true,
          education_level: true,
          hire_date: true,
          basic_salary: true,
          allowances: true,
          phone: true,
          tax_id: true,
          bank_name: true,
          bank_account_number: true,
          npwp: true,
          ptkp: true,
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
    } catch (selErr: any) {
      // Fallback for older Prisma client that doesn't know the new fields
      const msg = String(selErr?.message || '');
      if (msg.includes('Unknown arg') || msg.includes('Unknown field')) {
        legacy = await prisma.employees.findMany({
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
            gender: true,
            marital_status: true,
            blood_type: true,
            employment_type: true,
            status: true,
            education_level: true,
            hire_date: true,
            basic_salary: true,
            allowances: true,
            phone: true,
            tax_id: true,
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
      } else {
        throw selErr;
      }
    }

    if (legacy && legacy.length > 0) {
      console.log(`getAllEmployees: returning ${legacy.length} rows from legacy employees table`);
      // Normalize basic_salary to string for Decimal safety
      return legacy.map((emp: any) => ({ ...emp, basic_salary: emp.basic_salary ? String(emp.basic_salary) : null }));
    }

    // Fallback: try hr_employees (newer schema). This covers cases where data lives in hr_employees.
    const hr = await prisma.hr_employees.findMany();
    console.log(`getAllEmployees: legacy empty, returning ${hr.length} rows from hr_employees`);
    return hr.map((emp: any) => ({ ...emp, basic_salary: emp.basic_salary ? String(emp.basic_salary) : null }));
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    throw new Error('Gagal mengambil data employee: ' + error.message);
  }
};

// Get employee by ID with user info
export const getEmployeeById = async (employeeId: string) => {
  try {
    // Try legacy employees table first
    let employee: any = null;
    try {
      employee = await prisma.employees.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          full_name: true,
          position: true,
          department: true,
          gender: true,
          marital_status: true,
          blood_type: true,
          employment_type: true,
          status: true,
          education_level: true,
          hire_date: true,
          basic_salary: true,
          allowances: true,
          phone: true,
          tax_id: true,
          bank_name: true,
          bank_account_number: true,
          npwp: true,
          ptkp: true,
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
    } catch (selErr: any) {
      const msg = String(selErr?.message || '');
      if (msg.includes('Unknown arg') || msg.includes('Unknown field')) {
        employee = await prisma.employees.findUnique({
          where: { id: employeeId },
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
            gender: true,
            marital_status: true,
            blood_type: true,
            employment_type: true,
            status: true,
            education_level: true,
            hire_date: true,
            basic_salary: true,
            allowances: true,
            phone: true,
            tax_id: true,
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
      } else {
        throw selErr;
      }
    }

    if (employee) {
      console.log(`getEmployeeById: found in legacy employees id=${employeeId}`);
      return { ...employee, basic_salary: employee.basic_salary ? String(employee.basic_salary) : null } as any;
    }

    // Fallback to hr_employees
    const hrEmp = await prisma.hr_employees.findUnique({ where: { id: employeeId } as any });
    if (hrEmp) {
      console.log(`getEmployeeById: found in hr_employees id=${employeeId}`);
      return { ...hrEmp, basic_salary: hrEmp.basic_salary ? String(hrEmp.basic_salary) : null } as any;
    }

    return null;
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    throw new Error('Gagal mengambil data employee: ' + error.message);
  }
};

// ========== UPDATE OPERATIONS ==========

interface UpdateEmployeeData {
  full_name?: string;
  position?: string;
  department?: string;
  hire_date?: Date | string;
  basic_salary?: number | string;
  allowances?: any;
  gender?: string;
  marital_status?: string;
  blood_type?: string;
  phone?: string;
  employment_type?: string;
  status?: string;
  education_level?: string;
  bank_name?: string;
  bank_account_number?: string;
  npwp?: string;
  ptkp?: string;
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
    if (updateData.department !== undefined) {
      dataToUpdate.department = updateData.department;
    }
    if (updateData.hire_date !== undefined) {
      dataToUpdate.hire_date = new Date(updateData.hire_date);
    }
    if (updateData.basic_salary !== undefined) {
      // Normalize to string for Decimal
      let s = updateData.basic_salary;
      if (typeof s === 'string') {
        s = s.replace(/\./g, '').replace(/,/g, '.');
      }
      dataToUpdate.basic_salary = typeof s === 'number' ? String(s) : s;
    }
    if (updateData.allowances !== undefined) {
      dataToUpdate.allowances = updateData.allowances;
    }
    if (updateData.gender !== undefined) {
      dataToUpdate.gender = updateData.gender;
    }
    if (updateData.marital_status !== undefined) {
      dataToUpdate.marital_status = updateData.marital_status;
    }
    if (updateData.blood_type !== undefined) {
      dataToUpdate.blood_type = updateData.blood_type;
    }
    if (updateData.phone !== undefined) {
      dataToUpdate.phone = updateData.phone;
    }
    if (updateData.employment_type !== undefined) {
      dataToUpdate.employment_type = updateData.employment_type;
    }
    if (updateData.status !== undefined) {
      dataToUpdate.status = updateData.status;
    }
    if (updateData.education_level !== undefined) {
      dataToUpdate.education_level = updateData.education_level;
    }
    if (updateData.bank_name !== undefined) {
      dataToUpdate.bank_name = updateData.bank_name;
    }
    if (updateData.bank_account_number !== undefined) {
      dataToUpdate.bank_account_number = updateData.bank_account_number;
    }
    if (updateData.npwp !== undefined) {
      dataToUpdate.npwp = updateData.npwp;
    }
    if (updateData.ptkp !== undefined) {
      dataToUpdate.ptkp = updateData.ptkp;
    }

    // Update employee with fallbacks for client/schema drift
    let updatedEmployee: any;
    try {
      updatedEmployee = await prisma.employees.update({
        where: { id: employeeId },
        data: dataToUpdate,
        select: {
          id: true,
          full_name: true,
          position: true,
          department: true,
          gender: true,
          marital_status: true,
          blood_type: true,
          employment_type: true,
          status: true,
          education_level: true,
          hire_date: true,
          basic_salary: true,
          allowances: true,
          bank_name: true,
          bank_account_number: true,
          npwp: true,
          ptkp: true,
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
    } catch (err: any) {
      const msg = String(err?.message || '');
      // Handle enum mismatch on blood_type similar to create
      if (msg.includes('22P02') && msg.includes('BloodType') && dataToUpdate.blood_type) {
        const { blood_type, ...withoutBlood } = dataToUpdate;
        try {
          updatedEmployee = await prisma.employees.update({
            where: { id: employeeId },
            data: withoutBlood,
            select: {
              id: true,
              full_name: true,
              position: true,
              department: true,
              gender: true,
              marital_status: true,
              blood_type: true,
              employment_type: true,
              status: true,
              education_level: true,
              hire_date: true,
              basic_salary: true,
              allowances: true,
              bank_name: true,
              bank_account_number: true,
              npwp: true,
              ptkp: true,
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
        } catch (err2) {
          throw err2;
        }
      } else if (msg.includes('Unknown arg') || msg.includes('Unknown field')) {
        // Prisma client doesn't know new fields. Drop the new fields from data and select.
        const { bank_name, bank_account_number, npwp, ptkp, ...legacyData } = dataToUpdate;
        updatedEmployee = await prisma.employees.update({
          where: { id: employeeId },
          data: legacyData,
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
            gender: true,
            marital_status: true,
            blood_type: true,
            employment_type: true,
            status: true,
            education_level: true,
            hire_date: true,
            basic_salary: true,
            allowances: true,
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
      } else if (msg.includes('does not exist')) {
        // DB is missing some columns (on older env). Drop the optional fields.
        const { bank_name, bank_account_number, npwp, ptkp, ...legacyData } = dataToUpdate;
        updatedEmployee = await prisma.employees.update({
          where: { id: employeeId },
          data: legacyData,
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
            gender: true,
            marital_status: true,
            blood_type: true,
            employment_type: true,
            status: true,
            education_level: true,
            hire_date: true,
            basic_salary: true,
            allowances: true,
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
      } else {
        throw err;
      }
    }

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