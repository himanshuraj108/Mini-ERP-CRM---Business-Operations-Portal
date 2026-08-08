import { query, getClient } from '../../config/database';
import { Challan, ChallanItem, PaginatedResult } from '../../types';
import { CreateChallanInput, ChallanQueryInput } from './challans.schema';

async function generateChallanNumber(client: Awaited<ReturnType<typeof getClient>>): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const result = await client.query<{ count: string }>(
    `SELECT COUNT(*) FROM challans WHERE challan_number LIKE $1`,
    [`CHL-${dateStr}-%`]
  );

  const count = parseInt(result.rows[0].count, 10) + 1;
  const sequence = count.toString().padStart(4, '0');
  return `CHL-${dateStr}-${sequence}`;
}

export async function getChallans(
  params: ChallanQueryInput
): Promise<PaginatedResult<Challan>> {
  const { page, limit, search, status, customer_id, from_date, to_date } = params;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(ch.challan_number ILIKE $${paramIndex})`);
    values.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    conditions.push(`ch.status = $${paramIndex}`);
    values.push(status);
    paramIndex++;
  }

  if (customer_id) {
    conditions.push(`ch.customer_id = $${paramIndex}`);
    values.push(customer_id);
    paramIndex++;
  }

  if (from_date) {
    conditions.push(`ch.created_at >= $${paramIndex}`);
    values.push(from_date);
    paramIndex++;
  }

  if (to_date) {
    conditions.push(`ch.created_at <= $${paramIndex}`);
    values.push(to_date);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM challans ch ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await query<Challan & { customer_name: string; created_by_name: string }>(
    `SELECT ch.*, 
            ch.customer_snapshot->>'name' as customer_name,
            u.name as created_by_name
     FROM challans ch
     LEFT JOIN users u ON u.id = ch.created_by
     ${whereClause}
     ORDER BY ch.created_at DESC
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

export async function getChallanById(id: string): Promise<(Challan & { items: ChallanItem[] }) | null> {
  const challanResult = await query<Challan & { created_by_name: string }>(
    `SELECT ch.*, u.name as created_by_name
     FROM challans ch
     LEFT JOIN users u ON u.id = ch.created_by
     WHERE ch.id = $1`,
    [id]
  );

  if (!challanResult.rows[0]) return null;

  const challan = challanResult.rows[0];

  const itemsResult = await query<ChallanItem>(
    'SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY id',
    [id]
  );

  return { ...challan, items: itemsResult.rows };
}

export async function createChallan(
  data: CreateChallanInput,
  userId: string
): Promise<Challan & { items: ChallanItem[] }> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const customerResult = await client.query(
      'SELECT id, name, mobile, address, business_name FROM customers WHERE id = $1',
      [data.customer_id]
    );

    if (!customerResult.rows[0]) {
      throw new Error('Customer not found');
    }

    const customer = customerResult.rows[0];
    const customerSnapshot = {
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      address: customer.address,
      business_name: customer.business_name,
    };

    const challanNumber = await generateChallanNumber(client);

    const productIds = data.items.map((item) => item.product_id);
    const productsResult = await client.query(
      `SELECT id, name, sku, unit_price, current_stock FROM products WHERE id = ANY($1::uuid[])`,
      [productIds]
    );

    const productMap = new Map(productsResult.rows.map((p) => [p.id, p]));

    let totalQuantity = 0;
    const itemsToInsert: Array<{
      product_id: string;
      product_snapshot: object;
      quantity: number;
      unit_price: number;
    }> = [];

    for (const item of data.items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      if (data.status === 'Confirmed' && product.current_stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.current_stock}, Requested: ${item.quantity}`
        );
      }

      itemsToInsert.push({
        product_id: item.product_id,
        product_snapshot: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          unit_price: product.unit_price,
        },
        quantity: item.quantity,
        unit_price: product.unit_price,
      });

      totalQuantity += item.quantity;
    }

    const challanResult = await client.query<Challan>(
      `INSERT INTO challans (challan_number, customer_id, customer_snapshot, total_quantity, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [challanNumber, data.customer_id, JSON.stringify(customerSnapshot), totalQuantity, data.status, userId]
    );

    const challan = challanResult.rows[0];

    const insertedItems: ChallanItem[] = [];

    for (const item of itemsToInsert) {
      const itemResult = await client.query<ChallanItem>(
        `INSERT INTO challan_items (challan_id, product_id, product_snapshot, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [challan.id, item.product_id, JSON.stringify(item.product_snapshot), item.quantity, item.unit_price]
      );
      insertedItems.push(itemResult.rows[0]);
    }

    if (data.status === 'Confirmed') {
      for (const item of itemsToInsert) {
        await client.query(
          'UPDATE products SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2',
          [item.quantity, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [item.product_id, item.quantity, `Challan ${challanNumber}`, userId]
        );
      }
    }

    await client.query('COMMIT');
    return { ...challan, items: insertedItems };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function confirmChallan(
  id: string,
  userId: string
): Promise<Challan> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const challanResult = await client.query<Challan>(
      'SELECT * FROM challans WHERE id = $1 FOR UPDATE',
      [id]
    );

    const challan = challanResult.rows[0];

    if (!challan) throw new Error('Challan not found');
    if (challan.status !== 'Draft') {
      throw new Error(`Challan cannot be confirmed because it is already ${challan.status}`);
    }

    const itemsResult = await client.query<ChallanItem>(
      'SELECT * FROM challan_items WHERE challan_id = $1',
      [id]
    );

    for (const item of itemsResult.rows) {
      const productResult = await client.query(
        'SELECT id, name, current_stock FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );

      const product = productResult.rows[0];

      if (!product || product.current_stock < item.quantity) {
        const availableStock = product ? product.current_stock : 0;
        const productName = (item.product_snapshot as Record<string, string>).name || item.product_id;
        throw new Error(
          `Insufficient stock for "${productName}". Available: ${availableStock}, Required: ${item.quantity}`
        );
      }

      await client.query(
        'UPDATE products SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2',
        [item.quantity, item.product_id]
      );

      await client.query(
        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
         VALUES ($1, $2, 'OUT', $3, $4)`,
        [item.product_id, item.quantity, `Challan ${challan.challan_number}`, userId]
      );
    }

    const updatedResult = await client.query<Challan>(
      `UPDATE challans SET status = 'Confirmed', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
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

export async function cancelChallan(
  id: string,
  userId: string
): Promise<Challan> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const challanResult = await client.query<Challan>(
      'SELECT * FROM challans WHERE id = $1 FOR UPDATE',
      [id]
    );

    const challan = challanResult.rows[0];

    if (!challan) throw new Error('Challan not found');
    if (challan.status === 'Cancelled') {
      throw new Error('Challan is already cancelled');
    }

    if (challan.status === 'Confirmed') {
      const itemsResult = await client.query<ChallanItem>(
        'SELECT * FROM challan_items WHERE challan_id = $1',
        [id]
      );

      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE products SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2',
          [item.quantity, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
           VALUES ($1, $2, 'IN', $3, $4)`,
          [item.product_id, item.quantity, `Cancelled challan ${challan.challan_number}`, userId]
        );
      }
    }

    const updatedResult = await client.query<Challan>(
      `UPDATE challans SET status = 'Cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
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
