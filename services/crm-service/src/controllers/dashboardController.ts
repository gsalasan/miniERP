import { Request, Response } from 'express';
import { getSalesDashboard } from '../services/dashboardServices';

export async function getSalesDashboardController(req: Request, res: Response) {
  try {
    const user = (req as any).user || {};
    const query = {
      sales_user_id: req.query.sales_user_id as string | undefined,
      period: req.query.period as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    };
    const data = await getSalesDashboard(user, query);
    res.json({ success: true, message: 'Sales dashboard data', data });
  } catch (err: any) {
    console.error('Error getting sales dashboard:', err);
    res.status(500).json({ success: false, message: 'Failed to get dashboard', error: err?.message });
  }
}
