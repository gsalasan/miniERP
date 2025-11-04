import { Request, Response } from 'express';
import { 
  createEmployeeWithUser, 
  validateEmployeeUserData,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  updateEmployeeUser,
  deleteEmployee
} from '../services/employee.service';

// POST /employees - Create employee with user account
export const createEmployee = async (req: Request, res: Response) => {
  try {
    // Support TWO body shapes:
    // A) Service-native: { employee: {...}, user: {...}, email: string }
    // B) TSD v1.0: { personalInfo, jobInfo, compensation, accountInfo, systemInfo }
    const body = req.body as any;

    let normalized: any = null;
    const isServiceShape = body?.employee && body?.user && body?.email;
    const isTsdShape = body?.personalInfo || body?.jobInfo || body?.compensation || body?.accountInfo || body?.systemInfo;

    if (isServiceShape) {
      normalized = body;
    } else if (isTsdShape) {
      // Map TSD sections to service-native shape
      const personal = body.personalInfo || {};
      const job = body.jobInfo || {};
      const comp = body.compensation || {};
      const acct = body.accountInfo || {};
      const sys = body.systemInfo || {};

      normalized = {
        employee: {
          full_name: personal.fullName || personal.full_name,
          position: job.position,
          department: job.department,
          hire_date: job.hireDate || job.hire_date,
          basic_salary: comp.basicSalary || comp.basic_salary,
          allowances: Array.isArray(comp.allowances)
            ? (comp.allowances as any[]).reduce((acc: any, it: any) => {
                if (it?.name && (typeof it.value === 'number' || typeof it.value === 'string')) {
                  const n = typeof it.value === 'number' ? it.value : Number(String(it.value).replace(/\./g, '').replace(/,/g, '.'));
                  if (!Number.isNaN(n)) acc[it.name] = n;
                }
                return acc;
              }, {})
            : comp.allowances || {},
          // optional extended fields
          bank_name: acct.bankName || acct.bank_name,
          bank_account_number: acct.bankAccountNumber || acct.bank_account_number,
          npwp: acct.npwp,
          ptkp: acct.ptkp,
        },
        user: {
          email: sys.email,
          password: sys.password || sys.temporaryPassword || 'Temp#12345',
          roles: sys.role ? [sys.role] : Array.isArray(sys.roles) ? sys.roles : ['EMPLOYEE'],
        },
        email: sys.email,
      };
    }

    // Validate presence after normalization
    if (!normalized?.employee || !normalized?.user || !normalized?.email) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid request shape. Expected {employee,user,email} or TSD shape {personalInfo,jobInfo,compensation,accountInfo,systemInfo}',
      });
    }

    // Validate required fields
    const validationErrors = validateEmployeeUserData(normalized);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: validationErrors
      });
    }

    // Create employee and user in transaction
    const result = await createEmployeeWithUser(normalized);

    return res.status(201).json({
      success: true,
      message: 'Employee and user account created successfully',
      data: result
    });

  } catch (error: any) {
    console.error('Error in createEmployee controller:', error);

    // Handle known business logic errors
    if (error.message.includes('Email sudah terdaftar')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('position must be one of')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Handle validation errors
    if (error.message.includes('Validation')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /employees - List employees (optional, for testing)
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await getAllEmployees();
    return res.status(200).json({
      success: true,
      message: 'Employee list retrieved successfully',
      data: employees,
    });
  } catch (error: any) {
    console.error('Error in getEmployees:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ========== GET ALL EMPLOYEES ==========
export const listAllEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await getAllEmployees();

    return res.status(200).json({
      success: true,
      message: 'Employee list retrieved successfully',
      data: employees
    });
  } catch (error: any) {
    console.error('Error in listAllEmployees:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== GET EMPLOYEE BY ID ==========
export const getEmployeeByIdCtrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const employee = await getEmployeeById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee tidak ditemukan'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Employee retrieved successfully',
      data: employee
    });
  } catch (error: any) {
    console.error('Error in getEmployeeByIdCtrl:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== UPDATE EMPLOYEE ==========
export const updateEmployeeCtrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { full_name, position, department, hire_date, basic_salary, allowances, gender, marital_status, blood_type, employment_type, status, education_level, bank_name, bank_account_number, npwp, ptkp } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    if (!full_name && !position && !department && !hire_date && !basic_salary && !allowances && !gender && !marital_status && !blood_type && !employment_type && !status && !education_level && !bank_name && !bank_account_number && !npwp && !ptkp) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    const updatedEmployee = await updateEmployee(id, {
      full_name,
      position,
      department,
      hire_date,
      basic_salary,
      allowances,
      gender,
      marital_status,
      blood_type,
      employment_type,
      status,
      education_level,
      bank_name,
      bank_account_number,
      npwp,
      ptkp
    });

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error: any) {
    console.error('Error in updateEmployeeCtrl:', error);

    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== UPDATE EMPLOYEE USER (Roles & Status) ==========
export const updateEmployeeUserCtrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roles, is_active } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    if (roles === undefined && is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (roles or is_active) must be provided'
      });
    }

    const updatedUser = await updateEmployeeUser(id, {
      roles,
      is_active
    });

    return res.status(200).json({
      success: true,
      message: 'Employee user updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Error in updateEmployeeUserCtrl:', error);

    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Invalid roles')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== DELETE EMPLOYEE ==========
export const deleteEmployeeCtrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const result = await deleteEmployee(id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error: any) {
    console.error('Error in deleteEmployeeCtrl:', error);

    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Debug endpoint: return counts and sample rows from legacy and hr tables
export const listDebugEmployees = async (req: Request, res: Response) => {
  try {
    // Lazy import prisma util to avoid circular imports
    const { getPrisma } = await import('../utils/prisma');
    const prisma = getPrisma();

    const [employeesCount, hrEmployeesCount] = await Promise.all([
      prisma.employees.count().catch(() => 0),
      prisma.hr_employees.count().catch(() => 0),
    ]);

    const [employeesSample, hrEmployeesSample] = await Promise.all([
      prisma.employees.findMany({ take: 10 }).catch(() => []),
      prisma.hr_employees.findMany({ take: 10 }).catch(() => []),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Debug employees data',
      counts: { employees: employeesCount, hr_employees: hrEmployeesCount },
      samples: { employees: employeesSample, hr_employees: hrEmployeesSample }
    });
  } catch (err: any) {
    console.error('Error in listDebugEmployees:', err);
    return res.status(500).json({ success: false, message: 'Debug failed', error: err?.message });
  }
};