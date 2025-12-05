import { Request, Response } from 'express';
import { simulateIncentiveForUser } from '../services/incentiveService';

export async function simulateIncentiveController(req: Request, res: Response) {
  try {
    const loggedInUser = (req as any).user || {};
    const roles: string[] = (loggedInUser?.roles as string[]) || (loggedInUser?.role ? [loggedInUser.role] : []);

    const { userId, additionalSalesAmount } = req.body || {};

    if (additionalSalesAmount == null || isNaN(Number(additionalSalesAmount))) {
      return res.status(400).json({ success: false, message: 'additionalSalesAmount must be a number' });
    }

    // Determine target user: sales can only simulate for themselves; managers/CEO may simulate for others
    let targetUserId = userId;
    if (!targetUserId) targetUserId = loggedInUser.id;
    if (roles.includes('SALES') && !roles.includes('SALES_MANAGER') && !roles.includes('CEO')) {
      // override any provided userId
      targetUserId = loggedInUser.id;
    }

    if (!targetUserId) return res.status(400).json({ success: false, message: 'userId is required or you must be authenticated' });

    const result = await simulateIncentiveForUser(targetUserId, Number(additionalSalesAmount));

    return res.json({ success: true, message: 'Simulation result', data: result });
  } catch (err: any) {
    console.error('Error simulating incentive:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to simulate incentive' });
  }
}
import { Request, Response } from 'express';
import { simulateIncentive } from '../services/incentiveService';

export async function simulateIncentiveController(req: Request, res: Response) {
  try {
    const user = (req as any).user || {};
    const { userId, additionalSalesAmount } = req.body || {};

    if (additionalSalesAmount == null) {
      return res.status(400).json({ success: false, message: 'additionalSalesAmount is required' });
    }

    // If the caller is a SALES user, ensure they can only simulate for themselves
    const roles: string[] = (user?.roles as string[]) || (user?.role ? [user.role] : []);
    if (roles.includes('SALES') && !roles.includes('SALES_MANAGER') && !roles.includes('CEO')) {
      // override userId to logged in user
      const result = await simulateIncentive(user, { userId: user.id, additionalSalesAmount });
      return res.json({ success: true, message: 'Simulation result', data: result });
    }

    const result = await simulateIncentive(user, { userId, additionalSalesAmount });
    return res.json({ success: true, message: 'Simulation result', data: result });
  } catch (err: any) {
    console.error('simulateIncentiveController error', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to simulate incentive' });
  }
}

export default { simulateIncentiveController };
