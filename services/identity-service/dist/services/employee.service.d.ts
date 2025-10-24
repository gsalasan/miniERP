type UserRole = 'CEO' | 'FINANCE_ADMIN' | 'SALES' | 'SALES_MANAGER' | 'PROJECT_MANAGER' | 'PROJECT_ENGINEER' | 'HR_ADMIN' | 'EMPLOYEE' | 'PROCUREMENT_ADMIN' | 'ASSET_ADMIN' | 'SYSTEM_ADMIN';
interface CreateEmployeeData {
    full_name: string;
    position: string;
    hire_date: Date | string;
    basic_salary: number | string;
    allowances?: any;
}
interface CreateUserData {
    email: string;
    password: string;
    roles: UserRole[];
}
interface CreateEmployeeWithUserRequest {
    employee: CreateEmployeeData;
    user: CreateUserData;
    email: string;
}
export declare const createEmployeeWithUser: (data: CreateEmployeeWithUserRequest) => Promise<{
    employee: {
        id: string;
        full_name: string;
        position: string;
        hire_date: Date;
        basic_salary: import("@prisma/client/runtime/library").Decimal;
        allowances: import("@prisma/client/runtime/library").JsonValue;
    };
    user: {
        id: string;
        email: string;
        roles: import(".prisma/client").$Enums.UserRole[];
        employee_id: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
    };
}>;
export declare const validateEmployeeUserData: (data: CreateEmployeeWithUserRequest) => string[];
export declare const disconnectEmployeeService: () => Promise<void>;
export declare const getAllEmployees: () => Promise<({
    users: {
        id: string;
        email: string;
        roles: import(".prisma/client").$Enums.UserRole[];
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
    };
} & {
    id: string;
    full_name: string;
    position: string;
    hire_date: Date;
    basic_salary: import("@prisma/client/runtime/library").Decimal;
    allowances: import("@prisma/client/runtime/library").JsonValue;
})[]>;
export declare const getEmployeeById: (employeeId: string) => Promise<{
    users: {
        id: string;
        email: string;
        roles: import(".prisma/client").$Enums.UserRole[];
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
    };
} & {
    id: string;
    full_name: string;
    position: string;
    hire_date: Date;
    basic_salary: import("@prisma/client/runtime/library").Decimal;
    allowances: import("@prisma/client/runtime/library").JsonValue;
}>;
interface UpdateEmployeeData {
    full_name?: string;
    position?: string;
    hire_date?: Date | string;
    basic_salary?: number | string;
    allowances?: any;
}
export declare const updateEmployee: (employeeId: string, updateData: UpdateEmployeeData) => Promise<{
    users: {
        id: string;
        email: string;
        roles: import(".prisma/client").$Enums.UserRole[];
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
    };
} & {
    id: string;
    full_name: string;
    position: string;
    hire_date: Date;
    basic_salary: import("@prisma/client/runtime/library").Decimal;
    allowances: import("@prisma/client/runtime/library").JsonValue;
}>;
interface UpdateUserData {
    roles?: UserRole[];
    is_active?: boolean;
}
export declare const updateEmployeeUser: (employeeId: string, updateData: UpdateUserData) => Promise<{
    id: string;
    email: string;
    roles: import(".prisma/client").$Enums.UserRole[];
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}>;
export declare const deleteEmployee: (employeeId: string) => Promise<{
    success: boolean;
    message: string;
}>;
export {};
//# sourceMappingURL=employee.service.d.ts.map