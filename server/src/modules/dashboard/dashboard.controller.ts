import { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database';
import { ApiResponse } from '../../types';

export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      customersResult,
      productsResult,
      challansResult,
      recentChallansResult,
      lowStockResult,
    ] = await Promise.all([
      query<{ total: string; active: string; leads: string }>(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'Active') as active,
          COUNT(*) FILTER (WHERE status = 'Lead') as leads
        FROM customers
      `),
      query<{ total: string; low_stock: string }>(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE current_stock <= min_stock_alert) as low_stock
        FROM products
      `),
      query<{ total: string; confirmed: string; draft: string }>(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'Confirmed') as confirmed,
          COUNT(*) FILTER (WHERE status = 'Draft') as draft
        FROM challans
      `),
      query(`
        SELECT ch.id, ch.challan_number, ch.status, ch.total_quantity, ch.created_at,
               ch.customer_snapshot->>'name' as customer_name,
               u.name as created_by_name
        FROM challans ch
        LEFT JOIN users u ON u.id = ch.created_by
        ORDER BY ch.created_at DESC
        LIMIT 5
      `),
      query(`
        SELECT id, name, sku, current_stock, min_stock_alert
        FROM products
        WHERE current_stock <= min_stock_alert
        ORDER BY current_stock ASC
        LIMIT 5
      `),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        customers: customersResult.rows[0],
        products: productsResult.rows[0],
        challans: challansResult.rows[0],
        recentChallans: recentChallansResult.rows,
        lowStockProducts: lowStockResult.rows,
      },
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
