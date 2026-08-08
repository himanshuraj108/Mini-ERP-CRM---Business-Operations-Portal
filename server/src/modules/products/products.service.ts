import { query, getClient } from '../../config/database';
import { Product, StockMovement, PaginatedResult } from '../../types';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
  StockAdjustmentInput,
} from './products.schema';

export async function getProducts(
  params: ProductQueryInput
): Promise<PaginatedResult<Product>> {
  const { page, limit, search, category, low_stock } = params;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
    values.push(`%${search}%`);
    paramIndex++;
  }

  if (category) {
    conditions.push(`p.category ILIKE $${paramIndex}`);
    values.push(`%${category}%`);
    paramIndex++;
  }

  if (low_stock) {
    conditions.push(`p.current_stock <= p.min_stock_alert`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM products p ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await query<Product>(
    `SELECT p.*
     FROM products p
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...values, limit, offset]
  );

  return {
    data: dataResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await query<Product>(
    'SELECT * FROM products WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function createProduct(
  data: CreateProductInput,
  userId: string
): Promise<Product> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const productResult = await client.query<Product>(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        data.name,
        data.sku,
        data.category || null,
        data.unit_price,
        data.current_stock,
        data.min_stock_alert,
        data.location || null,
        userId,
      ]
    );

    const product = productResult.rows[0];

    if (data.current_stock > 0) {
      await client.query(
        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
         VALUES ($1, $2, 'IN', 'Initial stock entry', $3)`,
        [product.id, data.current_stock, userId]
      );
    }

    await client.query('COMMIT');
    return product;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<Product | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, unknown> = {
    name: data.name,
    sku: data.sku,
    category: data.category,
    unit_price: data.unit_price,
    min_stock_alert: data.min_stock_alert,
    location: data.location,
  };

  for (const [key, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value === '' ? null : value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await query<Product>(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await query('DELETE FROM products WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function adjustStock(
  productId: string,
  data: StockAdjustmentInput,
  userId: string
): Promise<Product> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const productResult = await client.query<Product>(
      'SELECT * FROM products WHERE id = $1 FOR UPDATE',
      [productId]
    );

    const product = productResult.rows[0];

    if (!product) {
      throw new Error('Product not found');
    }

    let newStock: number;

    if (data.movement_type === 'IN') {
      newStock = product.current_stock + data.quantity;
    } else {
      newStock = product.current_stock - data.quantity;
      if (newStock < 0) {
        throw new Error(
          `Insufficient stock. Available: ${product.current_stock}, Requested: ${data.quantity}`
        );
      }
    }

    const updatedResult = await client.query<Product>(
      'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newStock, productId]
    );

    await client.query(
      `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, data.quantity, data.movement_type, data.reason, userId]
    );

    await client.query('COMMIT');
    return updatedResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
  const result = await query<StockMovement>(
    `SELECT sm.*, u.name as created_by_name
     FROM stock_movements sm
     LEFT JOIN users u ON u.id = sm.created_by
     WHERE sm.product_id = $1
     ORDER BY sm.created_at DESC
     LIMIT 100`,
    [productId]
  );
  return result.rows;
}
