import { query } from '../../config/database';
import { Customer, CustomerFollowup, PaginatedResult } from '../../types';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryInput,
} from './customers.schema';

export async function getCustomers(
  params: CustomerQueryInput
): Promise<PaginatedResult<Customer>> {
  const { page, limit, search, status, customer_type } = params;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(
      `(c.name ILIKE $${paramIndex} OR c.mobile ILIKE $${paramIndex} OR c.business_name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`
    );
    values.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    conditions.push(`c.status = $${paramIndex}`);
    values.push(status);
    paramIndex++;
  }

  if (customer_type) {
    conditions.push(`c.customer_type = $${paramIndex}`);
    values.push(customer_type);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM customers c ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await query<Customer>(
    `SELECT c.*, u.name as created_by_name
     FROM customers c
     LEFT JOIN users u ON u.id = c.created_by
     ${whereClause}
     ORDER BY c.created_at DESC
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

export async function getCustomerById(id: string): Promise<Customer | null> {
  const result = await query<Customer>(
    `SELECT c.*, u.name as created_by_name
     FROM customers c
     LEFT JOIN users u ON u.id = c.created_by
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createCustomer(
  data: CreateCustomerInput,
  userId: string
): Promise<Customer> {
  const result = await query<Customer>(
    `INSERT INTO customers
       (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      data.name,
      data.mobile,
      data.email || null,
      data.business_name || null,
      data.gst_number || null,
      data.customer_type,
      data.address || null,
      data.status,
      data.follow_up_date || null,
      data.notes || null,
      userId,
    ]
  );
  return result.rows[0];
}

export async function updateCustomer(
  id: string,
  data: UpdateCustomerInput
): Promise<Customer | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, unknown> = {
    name: data.name,
    mobile: data.mobile,
    email: data.email,
    business_name: data.business_name,
    gst_number: data.gst_number,
    customer_type: data.customer_type,
    address: data.address,
    status: data.status,
    follow_up_date: data.follow_up_date,
    notes: data.notes,
  };

  for (const [key, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value || null);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<Customer>(
    `UPDATE customers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM customers WHERE id = $1',
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getFollowups(customerId: string): Promise<CustomerFollowup[]> {
  const result = await query<CustomerFollowup>(
    `SELECT f.*, u.name as created_by_name
     FROM customer_followups f
     LEFT JOIN users u ON u.id = f.created_by
     WHERE f.customer_id = $1
     ORDER BY f.created_at DESC`,
    [customerId]
  );
  return result.rows;
}

export async function addFollowup(
  customerId: string,
  note: string,
  userId: string
): Promise<CustomerFollowup> {
  const result = await query<CustomerFollowup>(
    `INSERT INTO customer_followups (customer_id, note, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [customerId, note, userId]
  );
  return result.rows[0];
}
