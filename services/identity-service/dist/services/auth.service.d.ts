type UserRole = 'CEO' | 'FINANCE_ADMIN' | 'SALES' | 'SALES_MANAGER' | 'PROJECT_MANAGER' | 'PROJECT_ENGINEER' | 'HR_ADMIN' | 'EMPLOYEE' | 'PROCUREMENT_ADMIN' | 'ASSET_ADMIN' | 'SYSTEM_ADMIN';
export declare const findUserByEmail: (email: string) => Promise<any>;
export declare const createUser: (email: string, password: string, roles: UserRole[], employee_id?: string) => Promise<any>;
export declare const generateToken: (user: any) => string;
export declare const loginUser: (email: string, password: string) => Promise<{
    user: any;
    token: string;
}>;
export declare const disconnectPrisma: () => Promise<void>;
export {};
//# sourceMappingURL=auth.service.d.ts.map