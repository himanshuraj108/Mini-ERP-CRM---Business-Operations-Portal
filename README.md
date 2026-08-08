# Mini ERP CRM Portal

**Live Demo:** [https://mini-erp-crm-business-operations-po.vercel.app](https://mini-erp-crm-business-operations-po.vercel.app)

A production-ready, full-stack ERP and CRM system built with the PERN stack (PostgreSQL, Express.js, React, Node.js with TypeScript). Designed for wholesale and distribution businesses to manage customers, products, stock, and sales challans.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router v6, React Hook Form, Zod, Axios |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| Auth | JWT (access token) + Refresh token (httpOnly cookie) |
| Validation | Zod on both frontend and backend |
| Security | Helmet.js, CORS, express-rate-limit, bcryptjs |

---

## Project Structure

```
MINI_CRM/
├── server/          Node.js + Express + TypeScript backend
├── client/          React + TypeScript + Vite frontend
└── README.md
```

---

## Local Setup

### Prerequisites
- Node.js v18 or higher
- PostgreSQL 14 or higher (or a Supabase / Neon account)

### Step 1 - Clone and install

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2 - Database setup

Create a PostgreSQL database named `mini_crm`.

Run the migration file to create all tables:

```bash
psql -U postgres -d mini_crm -f server/migrations/001_initial_schema.sql
```

Or paste the contents of `server/migrations/001_initial_schema.sql` into the Supabase SQL Editor.

### Step 3 - Configure environment variables

**Backend:**

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in your database URL and JWT secrets:

```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/mini_crm
JWT_SECRET=your_minimum_64_character_random_string_here
JWT_EXPIRY=8h
REFRESH_TOKEN_SECRET=another_minimum_64_character_random_string_here
REFRESH_TOKEN_EXPIRY=7d
ALLOWED_ORIGINS=http://localhost:5173
```

**Frontend:**

```bash
cp client/.env.example client/.env
```

The default points to `http://localhost:5000/api` which is correct for local development.

### Step 4 - Seed the database

```bash
cd server
npm run seed
```

This creates 4 test users and sample data.

**Test credentials (all passwords: `Admin@123`)**

| Email | Role |
|---|---|
| admin@minicrm.com | admin |
| sales@minicrm.com | sales |
| warehouse@minicrm.com | warehouse |
| accounts@minicrm.com | accounts |

### Step 5 - Run the application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Server starts at http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
App opens at http://localhost:5173

---

## Deployment

### Database - Supabase (free)
1. Create a project at https://supabase.com
2. Go to SQL Editor and run `server/migrations/001_initial_schema.sql`
3. Copy the connection string from Project Settings > Database

### Backend - Render (free)
1. Push code to GitHub
2. Create a new Web Service on https://render.com
3. Connect your GitHub repo, set root directory to `server`
4. Build command: `npm install && npm run build`
5. Start command: `node dist/index.js`
6. Add all environment variables from `.env.example` with production values
7. Set `DATABASE_URL` to your Supabase connection string
8. Set `ALLOWED_ORIGINS` to your Vercel frontend URL

### Frontend - Vercel (free)
1. Create a new project on https://vercel.com
2. Connect your GitHub repo, set root directory to `client`
3. Add environment variable `VITE_API_BASE_URL` pointing to your Render backend URL

---

## API Overview

All responses follow this format:
```json
{ "success": true, "data": {}, "message": "..." }
{ "success": false, "error": "...", "details": [] }
```

| Method | Endpoint | Auth Required | Roles |
|---|---|---|---|
| POST | /api/auth/login | No | All |
| POST | /api/auth/refresh | No | All |
| POST | /api/auth/logout | No | All |
| GET | /api/auth/me | Yes | All |
| GET | /api/dashboard/stats | Yes | All |
| GET | /api/customers | Yes | admin, sales |
| POST | /api/customers | Yes | admin, sales |
| GET | /api/customers/:id | Yes | admin, sales |
| PUT | /api/customers/:id | Yes | admin, sales |
| DELETE | /api/customers/:id | Yes | admin |
| GET | /api/customers/:id/followups | Yes | admin, sales |
| POST | /api/customers/:id/followups | Yes | admin, sales |
| GET | /api/products | Yes | All roles |
| POST | /api/products | Yes | admin, warehouse |
| GET | /api/products/:id | Yes | All roles |
| PUT | /api/products/:id | Yes | admin, warehouse |
| DELETE | /api/products/:id | Yes | admin |
| GET | /api/products/:id/stock-movements | Yes | admin, warehouse |
| POST | /api/products/:id/stock | Yes | admin, warehouse |
| GET | /api/challans | Yes | admin, sales, accounts |
| POST | /api/challans | Yes | admin, sales |
| GET | /api/challans/:id | Yes | admin, sales, accounts |
| PATCH | /api/challans/:id/confirm | Yes | admin, sales |
| PATCH | /api/challans/:id/cancel | Yes | admin, sales |

---

## Architecture

```
Client (React)
    |
    | HTTPS + Bearer token
    |
Server (Express)
    |-- authenticate middleware (validates JWT)
    |-- authorize middleware (checks role)
    |-- validate middleware (Zod schema check)
    |
    |-- Auth module
    |-- Customers module
    |-- Products module
    |-- Challans module
    |-- Dashboard module
    |
    | pg Pool (connection pool, max 20)
    |
PostgreSQL Database
```

Key design decisions:
- Stock deduction in challans uses a database transaction with `SELECT FOR UPDATE` row-level locking to prevent race conditions when multiple users confirm challans simultaneously
- Challan items store a `product_snapshot` (JSONB) at the time of challan creation so historical records remain accurate even if product prices change later
- Customer data stored as `customer_snapshot` in challans for the same reason
- Refresh tokens are stored in httpOnly cookies so they cannot be accessed by JavaScript in the browser

---

## Known Limitations

- No email notifications for follow-up dates
- No file/image upload for products
- No PDF invoice export (can be added with pdfkit)
- No Docker setup included
