-- ==========================================
-- SMP (Sarapan Murah Pagi) - Complete Database Schema
-- PostgreSQL / Supabase
-- ==========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- ENUM TYPES
-- ==========================================

CREATE TYPE user_role AS ENUM (
  'kasir', 
  'supervisor', 
  'owner_cabang', 
  'area_manager', 
  'hq_admin', 
  'ceo', 
  'investor', 
  'supplier'
);

CREATE TYPE branch_status AS ENUM ('active', 'inactive', 'maintenance', 'pending');
CREATE TYPE branch_type AS ENUM ('coco', 'franchise');
CREATE TYPE supplier_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
CREATE TYPE transaction_status AS ENUM ('completed', 'voided', 'pending');
CREATE TYPE payment_method AS ENUM ('cash', 'qris', 'transfer');
CREATE TYPE alert_type AS ENUM ('warning', 'critical', 'info');
CREATE TYPE alert_category AS ENUM ('revenue', 'supplier', 'stock', 'fraud', 'system');
CREATE TYPE notification_type AS ENUM ('whatsapp', 'telegram', 'email', 'push');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'hold');

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Branches table
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(50) NOT NULL,
  province VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type branch_type NOT NULL DEFAULT 'coco',
  status branch_status NOT NULL DEFAULT 'pending',
  daily_target INTEGER NOT NULL DEFAULT 2000000,
  opening_time TIME NOT NULL DEFAULT '04:30',
  closing_time TIME NOT NULL DEFAULT '09:00',
  supervisor_id UUID,
  franchise_owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role user_role NOT NULL,
  branch_id UUID REFERENCES branches(id),
  pin_hash VARCHAR(255),
  pin_expires_at TIMESTAMPTZ,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign keys to branches after users table is created
ALTER TABLE branches ADD CONSTRAINT fk_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(id);
ALTER TABLE branches ADD CONSTRAINT fk_franchise_owner FOREIGN KEY (franchise_owner_id) REFERENCES users(id);

-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  ktp_number VARCHAR(20) NOT NULL,
  ktp_photo_url TEXT NOT NULL,
  address TEXT NOT NULL,
  bank_name VARCHAR(50),
  bank_account_number VARCHAR(30),
  bank_account_name VARCHAR(100),
  status supplier_status NOT NULL DEFAULT 'pending',
  total_products INTEGER NOT NULL DEFAULT 0,
  avg_sell_through_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
  total_earnings BIGINT NOT NULL DEFAULT 0,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, ktp_number)
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  photo_url TEXT NOT NULL,
  qr_code VARCHAR(50) UNIQUE NOT NULL,
  price INTEGER NOT NULL DEFAULT 10000 CHECK (price = 10000),
  supplier_share INTEGER NOT NULL DEFAULT 9000 CHECK (supplier_share = 9000),
  smp_share INTEGER NOT NULL DEFAULT 1000 CHECK (smp_share = 1000),
  is_active BOOLEAN NOT NULL DEFAULT true,
  avg_daily_stock DECIMAL(5, 2) NOT NULL DEFAULT 0,
  avg_daily_sold DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Stocks table (tracks daily inventory per product)
CREATE TABLE daily_stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  date DATE NOT NULL,
  initial_stock INTEGER NOT NULL DEFAULT 0 CHECK (initial_stock >= 0),
  current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  sold_qty INTEGER NOT NULL DEFAULT 0 CHECK (sold_qty >= 0),
  returned_qty INTEGER NOT NULL DEFAULT 0 CHECK (returned_qty >= 0),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by UUID NOT NULL REFERENCES users(id),
  checked_out_at TIMESTAMPTZ,
  checked_out_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, date)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  transaction_number VARCHAR(30) UNIQUE NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  cashier_id UUID NOT NULL REFERENCES users(id),
  total_items INTEGER NOT NULL CHECK (total_items > 0),
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  payment_method payment_method NOT NULL,
  payment_reference VARCHAR(100),
  status transaction_status NOT NULL DEFAULT 'completed',
  voided_by UUID REFERENCES users(id),
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transaction Items table
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL DEFAULT 10000 CHECK (unit_price = 10000),
  subtotal BIGINT NOT NULL,
  supplier_share BIGINT NOT NULL,
  smp_share BIGINT NOT NULL,
  CONSTRAINT check_subtotal CHECK (subtotal = quantity * unit_price),
  CONSTRAINT check_supplier_share CHECK (supplier_share = quantity * 9000),
  CONSTRAINT check_smp_share CHECK (smp_share = quantity * 1000)
);

-- Daily Settlements table (end of day reconciliation)
CREATE TABLE daily_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  date DATE NOT NULL,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_items_sold INTEGER NOT NULL DEFAULT 0,
  total_revenue BIGINT NOT NULL DEFAULT 0,
  total_supplier_payout BIGINT NOT NULL DEFAULT 0,
  total_smp_revenue BIGINT NOT NULL DEFAULT 0,
  cash_collected BIGINT NOT NULL DEFAULT 0,
  qris_collected BIGINT NOT NULL DEFAULT 0,
  transfer_collected BIGINT NOT NULL DEFAULT 0,
  expected_cash BIGINT NOT NULL DEFAULT 0,
  cash_difference BIGINT NOT NULL DEFAULT 0,
  is_reconciled BOOLEAN NOT NULL DEFAULT false,
  reconciled_by UUID REFERENCES users(id),
  reconciled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, date)
);

-- Supplier Payments table
CREATE TABLE supplier_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  date DATE NOT NULL,
  total_items_sold INTEGER NOT NULL DEFAULT 0,
  gross_amount BIGINT NOT NULL DEFAULT 0,
  net_amount BIGINT NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES users(id),
  payment_method payment_method,
  payment_reference VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, supplier_id, date)
);

-- Supplier Scorecards table (monthly performance)
CREATE TABLE supplier_scorecards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  month VARCHAR(7) NOT NULL, -- Format: "2025-01"
  sell_through_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  attendance_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  quality_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  packaging_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  total_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  rank_in_branch INTEGER,
  total_items_supplied INTEGER NOT NULL DEFAULT 0,
  total_items_sold INTEGER NOT NULL DEFAULT 0,
  total_earnings BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(supplier_id, month)
);

-- Franchise table (for franchise management)
CREATE TABLE franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  contract_start DATE NOT NULL,
  contract_end DATE NOT NULL,
  royalty_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  initial_fee BIGINT NOT NULL,
  monthly_fee BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Royalty Payments table
CREATE TABLE royalty_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID NOT NULL REFERENCES franchises(id),
  month VARCHAR(7) NOT NULL,
  total_revenue BIGINT NOT NULL,
  royalty_amount BIGINT NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs table (immutable)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Make audit_logs immutable
CREATE OR REPLACE RULE prevent_audit_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE prevent_audit_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  type alert_type NOT NULL,
  category alert_category NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Branches indexes
CREATE INDEX idx_branches_status ON branches(status);
CREATE INDEX idx_branches_city ON branches(city);
CREATE INDEX idx_branches_type ON branches(type);

-- Users indexes
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Suppliers indexes
CREATE INDEX idx_suppliers_branch ON suppliers(branch_id);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_rating ON suppliers(rating DESC);

-- Products indexes
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_branch ON products(branch_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_qr ON products(qr_code);

-- Daily stocks indexes
CREATE INDEX idx_daily_stocks_branch_date ON daily_stocks(branch_id, date);
CREATE INDEX idx_daily_stocks_supplier_date ON daily_stocks(supplier_id, date);
CREATE INDEX idx_daily_stocks_product_date ON daily_stocks(product_id, date);

-- Transactions indexes
CREATE INDEX idx_transactions_branch_date ON transactions(branch_id, date);
CREATE INDEX idx_transactions_cashier ON transactions(cashier_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- Transaction items indexes
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);
CREATE INDEX idx_transaction_items_supplier ON transaction_items(supplier_id);

-- Settlements indexes
CREATE INDEX idx_settlements_branch_date ON daily_settlements(branch_id, date DESC);

-- Supplier payments indexes
CREATE INDEX idx_supplier_payments_branch_date ON supplier_payments(branch_id, date);
CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id, date DESC);
CREATE INDEX idx_supplier_payments_status ON supplier_payments(payment_status);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_branch ON audit_logs(branch_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Alerts indexes
CREATE INDEX idx_alerts_branch ON alerts(branch_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get user branch
CREATE OR REPLACE FUNCTION get_user_branch(user_id UUID)
RETURNS UUID AS $$
  SELECT branch_id FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Branches policies
CREATE POLICY "HQ can view all branches" ON branches
  FOR SELECT USING (
    get_user_role(auth.uid()) IN ('hq_admin', 'ceo', 'investor', 'area_manager')
  );

CREATE POLICY "Branch staff can view own branch" ON branches
  FOR SELECT USING (
    id = get_user_branch(auth.uid())
  );

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "HQ can view all users" ON users
  FOR SELECT USING (
    get_user_role(auth.uid()) IN ('hq_admin', 'ceo')
  );

-- Suppliers policies
CREATE POLICY "Branch staff can view own suppliers" ON suppliers
  FOR SELECT USING (
    branch_id = get_user_branch(auth.uid())
    OR get_user_role(auth.uid()) IN ('hq_admin', 'ceo', 'area_manager')
  );

CREATE POLICY "Supplier can view own data" ON suppliers
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Products policies
CREATE POLICY "Branch staff can view branch products" ON products
  FOR SELECT USING (
    branch_id = get_user_branch(auth.uid())
    OR get_user_role(auth.uid()) IN ('hq_admin', 'ceo', 'area_manager')
  );

-- Transactions policies
CREATE POLICY "Branch staff can view branch transactions" ON transactions
  FOR SELECT USING (
    branch_id = get_user_branch(auth.uid())
    OR get_user_role(auth.uid()) IN ('hq_admin', 'ceo', 'area_manager', 'investor')
  );

CREATE POLICY "Kasir can create transactions" ON transactions
  FOR INSERT WITH CHECK (
    branch_id = get_user_branch(auth.uid())
    AND get_user_role(auth.uid()) IN ('kasir', 'supervisor')
  );

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER tr_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_daily_stocks_updated_at BEFORE UPDATE ON daily_stocks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_daily_settlements_updated_at BEFORE UPDATE ON daily_settlements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_supplier_payments_updated_at BEFORE UPDATE ON supplier_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit log trigger function
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (branch_id, user_id, action, entity_type, entity_id, new_data)
    VALUES (NEW.branch_id, auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (branch_id, user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (COALESCE(NEW.branch_id, OLD.branch_id), auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (branch_id, user_id, action, entity_type, entity_id, old_data)
    VALUES (OLD.branch_id, auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
CREATE TRIGGER tr_transactions_audit AFTER INSERT OR UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER tr_daily_stocks_audit AFTER INSERT OR UPDATE ON daily_stocks FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER tr_supplier_payments_audit AFTER INSERT OR UPDATE ON supplier_payments FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Update stock on transaction
CREATE OR REPLACE FUNCTION update_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_stocks
  SET 
    current_stock = current_stock - NEW.quantity,
    sold_qty = sold_qty + NEW.quantity,
    updated_at = NOW()
  WHERE 
    product_id = NEW.product_id 
    AND date = CURRENT_DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_stock_on_sale 
  AFTER INSERT ON transaction_items 
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_transaction();

-- ==========================================
-- VIEWS
-- ==========================================

-- Daily branch summary view
CREATE OR REPLACE VIEW v_daily_branch_summary AS
SELECT 
  b.id AS branch_id,
  b.name AS branch_name,
  b.code AS branch_code,
  b.city,
  CURRENT_DATE AS date,
  COALESCE(SUM(t.total_amount), 0) AS total_revenue,
  COUNT(DISTINCT t.id) AS total_transactions,
  COALESCE(SUM(t.total_items), 0) AS total_items_sold,
  COUNT(DISTINCT ds.supplier_id) AS active_suppliers,
  b.daily_target,
  CASE 
    WHEN b.daily_target > 0 
    THEN ROUND((COALESCE(SUM(t.total_amount), 0)::DECIMAL / b.daily_target * 100), 2)
    ELSE 0 
  END AS achievement_rate
FROM branches b
LEFT JOIN transactions t ON t.branch_id = b.id AND t.date = CURRENT_DATE AND t.status = 'completed'
LEFT JOIN daily_stocks ds ON ds.branch_id = b.id AND ds.date = CURRENT_DATE
WHERE b.status = 'active'
GROUP BY b.id, b.name, b.code, b.city, b.daily_target;

-- Supplier daily performance view
CREATE OR REPLACE VIEW v_supplier_daily_performance AS
SELECT 
  s.id AS supplier_id,
  s.name AS supplier_name,
  s.branch_id,
  CURRENT_DATE AS date,
  COALESCE(SUM(ds.initial_stock), 0) AS total_stock,
  COALESCE(SUM(ds.sold_qty), 0) AS total_sold,
  COALESCE(SUM(ds.returned_qty), 0) AS total_returned,
  COALESCE(SUM(ds.sold_qty) * 9000, 0) AS earnings,
  CASE 
    WHEN COALESCE(SUM(ds.initial_stock), 0) > 0 
    THEN ROUND((COALESCE(SUM(ds.sold_qty), 0)::DECIMAL / SUM(ds.initial_stock) * 100), 2)
    ELSE 0 
  END AS sell_through_rate
FROM suppliers s
LEFT JOIN daily_stocks ds ON ds.supplier_id = s.id AND ds.date = CURRENT_DATE
WHERE s.status = 'approved'
GROUP BY s.id, s.name, s.branch_id;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number(p_branch_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_date VARCHAR;
  v_sequence INTEGER;
  v_number VARCHAR;
BEGIN
  v_date := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(transaction_number FROM LENGTH(p_branch_code) + 7) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM transactions
  WHERE transaction_number LIKE p_branch_code || v_date || '%'
    AND date = CURRENT_DATE;
  
  v_number := p_branch_code || v_date || LPAD(v_sequence::TEXT, 4, '0');
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Calculate daily settlement
CREATE OR REPLACE FUNCTION calculate_daily_settlement(p_branch_id UUID, p_date DATE)
RETURNS UUID AS $$
DECLARE
  v_settlement_id UUID;
  v_totals RECORD;
BEGIN
  -- Get transaction totals
  SELECT 
    COUNT(*) AS total_transactions,
    COALESCE(SUM(total_items), 0) AS total_items,
    COALESCE(SUM(total_amount), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) AS cash,
    COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN total_amount ELSE 0 END), 0) AS qris,
    COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END), 0) AS transfer
  INTO v_totals
  FROM transactions
  WHERE branch_id = p_branch_id 
    AND date = p_date 
    AND status = 'completed';

  -- Insert or update settlement
  INSERT INTO daily_settlements (
    branch_id, date, 
    total_transactions, total_items_sold, total_revenue,
    total_supplier_payout, total_smp_revenue,
    cash_collected, qris_collected, transfer_collected,
    expected_cash
  ) VALUES (
    p_branch_id, p_date,
    v_totals.total_transactions, v_totals.total_items, v_totals.total_revenue,
    v_totals.total_revenue * 0.9, v_totals.total_revenue * 0.1,
    v_totals.cash, v_totals.qris, v_totals.transfer,
    v_totals.cash
  )
  ON CONFLICT (branch_id, date) 
  DO UPDATE SET
    total_transactions = EXCLUDED.total_transactions,
    total_items_sold = EXCLUDED.total_items_sold,
    total_revenue = EXCLUDED.total_revenue,
    total_supplier_payout = EXCLUDED.total_supplier_payout,
    total_smp_revenue = EXCLUDED.total_smp_revenue,
    cash_collected = EXCLUDED.cash_collected,
    qris_collected = EXCLUDED.qris_collected,
    transfer_collected = EXCLUDED.transfer_collected,
    expected_cash = EXCLUDED.expected_cash,
    updated_at = NOW()
  RETURNING id INTO v_settlement_id;

  RETURN v_settlement_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate supplier payments for the day
CREATE OR REPLACE FUNCTION calculate_supplier_payments(p_branch_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO supplier_payments (branch_id, supplier_id, date, total_items_sold, gross_amount, net_amount)
  SELECT 
    p_branch_id,
    ti.supplier_id,
    p_date,
    SUM(ti.quantity),
    SUM(ti.subtotal),
    SUM(ti.supplier_share)
  FROM transactions t
  JOIN transaction_items ti ON ti.transaction_id = t.id
  WHERE t.branch_id = p_branch_id 
    AND t.date = p_date 
    AND t.status = 'completed'
  GROUP BY ti.supplier_id
  ON CONFLICT (branch_id, supplier_id, date) 
  DO UPDATE SET
    total_items_sold = EXCLUDED.total_items_sold,
    gross_amount = EXCLUDED.gross_amount,
    net_amount = EXCLUDED.net_amount,
    updated_at = NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
