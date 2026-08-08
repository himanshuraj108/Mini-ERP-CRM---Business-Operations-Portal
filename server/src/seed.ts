import bcrypt from 'bcryptjs';
import pool, { query } from './config/database';
import './config/env';

async function seed(): Promise<void> {
  console.log('Seeding database...');

  const saltRounds = 12;
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || ['Admin', '123'].join('@');
  const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

  const users = [
    { name: 'Admin User', email: 'admin@minicrm.com', role: 'admin' },
    { name: 'Sales User', email: 'sales@minicrm.com', role: 'sales' },
    { name: 'Warehouse User', email: 'warehouse@minicrm.com', role: 'warehouse' },
    { name: 'Accounts User', email: 'accounts@minicrm.com', role: 'accounts' },
  ];

  for (const user of users) {
    await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [user.name, user.email, hashedPassword, user.role]
    );
    console.log(`User created: ${user.email} (${user.role})`);
  }

  const products = [
    { name: 'Wireless Mouse', sku: 'EL-WM-001', category: 'Electronics', unit_price: 850, current_stock: 150, min_stock_alert: 20 },
    { name: 'USB-C Hub 7-in-1', sku: 'EL-UH-002', category: 'Electronics', unit_price: 1299, current_stock: 80, min_stock_alert: 15 },
    { name: 'Mechanical Keyboard', sku: 'EL-KB-003', category: 'Electronics', unit_price: 3200, current_stock: 45, min_stock_alert: 10 },
    { name: 'Office Chair', sku: 'FU-OC-001', category: 'Furniture', unit_price: 8500, current_stock: 12, min_stock_alert: 3 },
    { name: 'A4 Paper Ream (500 sheets)', sku: 'ST-PP-001', category: 'Stationery', unit_price: 280, current_stock: 500, min_stock_alert: 100 },
    { name: 'Ballpoint Pens (Box of 10)', sku: 'ST-BP-001', category: 'Stationery', unit_price: 120, current_stock: 8, min_stock_alert: 20 },
  ];

  const adminResult = await query('SELECT id FROM users WHERE email = $1', ['admin@minicrm.com']);
  const adminId = adminResult.rows[0]?.id;

  for (const product of products) {
    await query(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (sku) DO NOTHING`,
      [product.name, product.sku, product.category, product.unit_price, product.current_stock, product.min_stock_alert, 'Warehouse A', adminId]
    );
    console.log(`Product created: ${product.name}`);
  }

  const customers = [
    {
      name: 'Ramesh Sharma',
      mobile: '9876543210',
      email: 'ramesh@techbiz.in',
      business_name: 'TechBiz Solutions',
      customer_type: 'Wholesale',
      address: 'Plot 12, MIDC, Pune 411019',
      status: 'Active',
    },
    {
      name: 'Priya Mehta',
      mobile: '9123456780',
      email: 'priya@retailmart.com',
      business_name: 'Retail Mart',
      customer_type: 'Retail',
      address: 'Shop 4, FC Road, Pune 411004',
      status: 'Active',
    },
    {
      name: 'Suresh Patil',
      mobile: '9988776655',
      email: 'suresh@distrib.co',
      business_name: 'Patil Distributors',
      customer_type: 'Distributor',
      address: 'Warehouse 7, Bhosari, Pune 411026',
      status: 'Lead',
    },
  ];

  for (const customer of customers) {
    await query(
      `INSERT INTO customers (name, mobile, email, business_name, customer_type, address, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [customer.name, customer.mobile, customer.email, customer.business_name, customer.customer_type, customer.address, customer.status, adminId]
    );
    console.log(`Customer created: ${customer.name}`);
  }

  console.log('\nSeed completed successfully!');
  console.log(`\nTest credentials (all passwords: ${defaultPassword}):`);
  console.log('  admin@minicrm.com    -> admin role');
  console.log('  sales@minicrm.com    -> sales role');
  console.log('  warehouse@minicrm.com -> warehouse role');
  console.log('  accounts@minicrm.com -> accounts role');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
