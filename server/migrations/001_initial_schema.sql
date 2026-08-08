CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('admin', 'sales', 'warehouse', 'accounts');
CREATE TYPE customer_type AS ENUM ('Retail', 'Wholesale', 'Distributor');
CREATE TYPE customer_status AS ENUM ('Lead', 'Active', 'Inactive');
CREATE TYPE movement_type AS ENUM ('IN', 'OUT');
CREATE TYPE challan_status AS ENUM ('Draft', 'Confirmed', 'Cancelled');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'sales',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  mobile          VARCHAR(15) NOT NULL,
  email           VARCHAR(150),
  business_name   VARCHAR(150),
  gst_number      VARCHAR(20),
  customer_type   customer_type NOT NULL DEFAULT 'Retail',
  address         TEXT,
  status          customer_status NOT NULL DEFAULT 'Lead',
  follow_up_date  DATE,
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customer_followups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(150) NOT NULL,
  sku              VARCHAR(50) NOT NULL UNIQUE,
  category         VARCHAR(100),
  unit_price       NUMERIC(12, 2) NOT NULL,
  current_stock    INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  min_stock_alert  INTEGER NOT NULL DEFAULT 10,
  location         VARCHAR(100),
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_movements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  movement_type movement_type NOT NULL,
  reason        VARCHAR(255) NOT NULL,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE challans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_number    VARCHAR(30) NOT NULL UNIQUE,
  customer_id       UUID NOT NULL REFERENCES customers(id),
  customer_snapshot JSONB NOT NULL,
  total_quantity    INTEGER NOT NULL DEFAULT 0,
  status            challan_status NOT NULL DEFAULT 'Draft',
  created_by        UUID NOT NULL REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE challan_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_id       UUID NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES products(id),
  product_snapshot JSONB NOT NULL,
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  unit_price       NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_mobile ON customers(mobile);
CREATE INDEX idx_customers_created_by ON customers(created_by);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_low_stock ON products(current_stock) WHERE current_stock <= min_stock_alert;

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);

CREATE INDEX idx_challans_status ON challans(status);
CREATE INDEX idx_challans_customer_id ON challans(customer_id);
CREATE INDEX idx_challans_created_at ON challans(created_at DESC);
CREATE INDEX idx_challans_challan_number ON challans(challan_number);

CREATE INDEX idx_challan_items_challan_id ON challan_items(challan_id);
CREATE INDEX idx_challan_items_product_id ON challan_items(product_id);

CREATE INDEX idx_customer_followups_customer_id ON customer_followups(customer_id);
