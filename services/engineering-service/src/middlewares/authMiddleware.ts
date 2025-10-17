import { Request, Response, NextFunction } from 'express';

// Dummy middleware, replace with actual logic from Identity Service
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Integrate with Identity Service
  if (req.headers.authorization) {
    // Simulate valid token
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export default authMiddleware;
