import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET || 'minierpsecret';
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Attach user info from token to request
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      roles: decoded.roles || ['EMPLOYEE'],
      employee_id: decoded.employee_id || decoded.employeeId
    };
    
    console.log('✅ Token verified for user:', req.user.email || req.user.id);
    next();
  } catch (error: any) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to check if user has specific role(s)
export const requireRole = (allowedRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRoles = Array.isArray(user.roles) ? user.roles : [user.role]; // Support both old (role) and new (roles) format
      const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Check if user has at least one of the required roles
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required_roles: requiredRoles,
          user_roles: userRoles
        });
      }
      
      next();
    } catch (error: any) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};