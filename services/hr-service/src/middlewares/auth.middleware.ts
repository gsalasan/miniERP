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
    // Development shortcut: BYPASS auth entirely when DISABLE_AUTH is true
    if (process.env.DISABLE_AUTH === 'true') {
      console.log('🔓 Auth disabled - bypassing token verification');
      req.user = { 
        id: 'db61ee62-3276-4828-b1e1-13c5f2b5aa19', // User ID untuk dev-ot@unais.com
        roles: ['HR_ADMIN', 'EMPLOYEE'], 
        employee_id: 'db61ee62-3276-4828-b1e1-88fb26c0a3a1' // Employee ID for dev+ot@unais.com
      };
      return next();
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    
    // Add user to request object
    req.user = decoded;
    
    next();
  } catch (error: any) {
    // Fallback: if DISABLE_AUTH in any form, bypass
    if (process.env.DISABLE_AUTH) {
      console.log('🔓 Auth error but DISABLE_AUTH set - bypassing');
      req.user = { id: 'dev-user', roles: ['HR_ADMIN'], employee_id: 'dev-employee' };
      return next();
    }
    
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token verification failed'
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