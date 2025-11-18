import { Request, Response, NextFunction } from 'express';

interface UserPayload {
  userId: string;
  email: string;
  name?: string;
  roles: string[];
}

interface AuthRequest extends Request {
  user?: UserPayload;
}

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles Array of role codes that are allowed to access the route
 * @returns Express middleware function
 * 
 * Usage:
 * router.post('/api/v1/materials', requireRole(['PROJECT_MANAGER']), createMaterial);
 * router.get('/api/v1/materials', requireRole(['PROJECT_MANAGER', 'PROJECT_ENGINEER']), getMaterials);
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    
    // Check if user exists (should be set by verifyToken middleware)
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not authenticated'
      });
    }

    const userRoles = authReq.user.roles || [];

    // Check if user has any of the allowed roles
    const hasRole = userRoles.some((role: string) => 
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden - Requires one of these roles: ${allowedRoles.join(', ')}`,
        userRoles: userRoles,
        requiredRoles: allowedRoles
      });
    }

    // User has required role, proceed
    next();
  };
};

/**
 * Middleware specifically for Project Manager only access
 */
export const requireProjectManager = requireRole(['PROJECT_MANAGER']);

/**
 * Middleware for Project Engineer only access
 */
export const requireProjectEngineer = requireRole(['PROJECT_ENGINEER']);

/**
 * Middleware for both PM and PE access
 */
export const requireEngineeringAccess = requireRole(['PROJECT_MANAGER', 'PROJECT_ENGINEER']);
