-- 1. Apartments / Residents Table
CREATE TABLE apartments (
  apt_number VARCHAR(10) PRIMARY KEY, -- e.g. '101', 'G15', '414'
  floor VARCHAR(20) NOT NULL,
  block VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL, -- 'left' or 'right' of the corridor, used to draw the floor plan
  is_gate BOOLEAN DEFAULT FALSE, -- true for the ground-floor gate slot (no resident data)
  resident_name VARCHAR(100) DEFAULT '',
  resident_phone VARCHAR(20) DEFAULT '',
  owner_name VARCHAR(100) DEFAULT '',
  is_rented BOOLEAN DEFAULT FALSE,
  has_paid BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Financial Transactions & Receipts (Money in Building Box)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) CHECK (type IN ('income', 'expense')), -- 'income' (maintenance) or 'expense' (repairs/bills)
  amount DECIMAL(10, 2) NOT NULL,
  title VARCHAR(255) NOT NULL, -- e.g. "Elevator Repair", "Oct Maintenance 101"
  apt_number VARCHAR(10) REFERENCES apartments(apt_number) ON DELETE SET NULL,
  receipt_url TEXT, -- Link to uploaded receipt image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (Residents) to READ
CREATE POLICY "Public Read Apartments" ON apartments FOR SELECT USING (true);
CREATE POLICY "Public Read Transactions" ON transactions FOR SELECT USING (true);

-- Allow ONLY LOGGED-IN ADMINS to INSERT, UPDATE, DELETE
CREATE POLICY "Admin Full Access Apartments" ON apartments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access Transactions" ON transactions FOR ALL USING (auth.role() = 'authenticated');