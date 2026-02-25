-- ============================================
-- Proof-of-Action Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- Wallet-based identity, no real names required
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  reputation INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- ============================================
-- EMERGENCY REQUESTS TABLE
-- Privacy-first: uses geohash instead of exact GPS
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_wallet TEXT NOT NULL REFERENCES users(wallet_address),
  request_type TEXT NOT NULL,
  description TEXT,
  geohash TEXT NOT NULL, -- Privacy-preserving location (e.g., 'dr5r9' = ~2.4km precision)
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_status ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_geohash ON emergency_requests(geohash);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON emergency_requests(requester_wallet);

-- ============================================
-- RESPONSES TABLE
-- Tracks who responded to which request
-- ============================================
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
  responder_wallet TEXT NOT NULL REFERENCES users(wallet_address),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_responses_request ON responses(request_id);
CREATE INDEX IF NOT EXISTS idx_responses_responder ON responses(responder_wallet);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);

-- ============================================
-- ACTION VERIFICATIONS TABLE
-- AI verification results with confidence scores
-- ============================================
CREATE TABLE IF NOT EXISTS action_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES emergency_requests(id) ON DELETE CASCADE,
  responder_wallet TEXT REFERENCES users(wallet_address),
  confidence_score NUMERIC(4, 3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  verified BOOLEAN DEFAULT FALSE,
  verification_data JSONB DEFAULT '{}', -- Stores full AI breakdown
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_verifications_request ON action_verifications(request_id);
CREATE INDEX IF NOT EXISTS idx_verifications_responder ON action_verifications(responder_wallet);
CREATE INDEX IF NOT EXISTS idx_verifications_verified ON action_verifications(verified);

-- ============================================
-- REWARDS TABLE
-- DeFi: On-chain reward tracking
-- ============================================
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  transaction_hash TEXT, -- NEAR transaction reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_rewards_wallet ON rewards(wallet_address);
CREATE INDEX IF NOT EXISTS idx_rewards_claimed ON rewards(claimed);

-- ============================================
-- REPORTS TABLE
-- Anti-fraud: Community-driven reporting
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_wallet TEXT REFERENCES users(wallet_address),
  reported_wallet TEXT NOT NULL REFERENCES users(wallet_address),
  request_id UUID REFERENCES emergency_requests(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_wallet);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable privacy and security
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so this script can be re-run safely
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users are readable" ON users;
DROP POLICY IF EXISTS "Users can be created" ON users;
DROP POLICY IF EXISTS "Users can be updated" ON users;

DROP POLICY IF EXISTS "Open requests are visible to all" ON emergency_requests;
DROP POLICY IF EXISTS "Users can create requests" ON emergency_requests;
DROP POLICY IF EXISTS "Requesters can update their requests" ON emergency_requests;
DROP POLICY IF EXISTS "Requests are readable" ON emergency_requests;
DROP POLICY IF EXISTS "Requests can be created" ON emergency_requests;
DROP POLICY IF EXISTS "Requests can be updated" ON emergency_requests;

DROP POLICY IF EXISTS "Responses visible to involved parties" ON responses;
DROP POLICY IF EXISTS "Users can create responses" ON responses;
DROP POLICY IF EXISTS "Responses are readable" ON responses;
DROP POLICY IF EXISTS "Responses can be created" ON responses;
DROP POLICY IF EXISTS "Responses can be updated" ON responses;

DROP POLICY IF EXISTS "Verifications are publicly visible" ON action_verifications;
DROP POLICY IF EXISTS "Verifications are readable" ON action_verifications;
DROP POLICY IF EXISTS "Verifications can be created" ON action_verifications;

DROP POLICY IF EXISTS "Users can see own rewards" ON rewards;
DROP POLICY IF EXISTS "Rewards are readable" ON rewards;
DROP POLICY IF EXISTS "Rewards can be created" ON rewards;

DROP POLICY IF EXISTS "Reports are readable" ON reports;
DROP POLICY IF EXISTS "Reports can be created" ON reports;

-- Demo mode policies

CREATE POLICY "Users are readable"
  ON users FOR SELECT USING (true);

CREATE POLICY "Users can be created"
  ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can be updated"
  ON users FOR UPDATE USING (true);

CREATE POLICY "Requests are readable"
  ON emergency_requests FOR SELECT USING (true);

CREATE POLICY "Requests can be created"
  ON emergency_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Requests can be updated"
  ON emergency_requests FOR UPDATE USING (true);

CREATE POLICY "Responses are readable"
  ON responses FOR SELECT USING (true);

CREATE POLICY "Responses can be created"
  ON responses FOR INSERT WITH CHECK (true);

CREATE POLICY "Responses can be updated"
  ON responses FOR UPDATE USING (true);

CREATE POLICY "Verifications are readable"
  ON action_verifications FOR SELECT USING (true);

CREATE POLICY "Verifications can be created"
  ON action_verifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Rewards are readable"
  ON rewards FOR SELECT USING (true);

CREATE POLICY "Rewards can be created"
  ON rewards FOR INSERT WITH CHECK (true);

CREATE POLICY "Reports are readable"
  ON reports FOR SELECT USING (true);

CREATE POLICY "Reports can be created"
  ON reports FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emergency_requests_updated_at ON emergency_requests;
CREATE TRIGGER update_emergency_requests_updated_at BEFORE UPDATE ON emergency_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_responses_updated_at ON responses;
CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Community stats view
CREATE OR REPLACE VIEW community_stats AS
SELECT 
  COUNT(DISTINCT users.id) as total_users,
  COUNT(DISTINCT emergency_requests.id) as total_requests,
  COUNT(DISTINCT CASE WHEN emergency_requests.status = 'resolved' THEN emergency_requests.id END) as resolved_requests,
  COUNT(DISTINCT responses.id) as total_responses,
  SUM(rewards.amount) as total_rewards_distributed,
  AVG(users.reputation) as avg_reputation
FROM users
LEFT JOIN emergency_requests ON emergency_requests.requester_wallet = users.wallet_address
LEFT JOIN responses ON responses.responder_wallet = users.wallet_address
LEFT JOIN rewards ON rewards.wallet_address = users.wallet_address;

-- Leaderboard view
CREATE OR REPLACE VIEW reputation_leaderboard AS
SELECT 
  users.wallet_address,
  users.reputation,
  COUNT(DISTINCT responses.id) as help_actions,
  SUM(rewards.amount) as total_earned,
  RANK() OVER (ORDER BY users.reputation DESC) as rank
FROM users
LEFT JOIN responses ON responses.responder_wallet = users.wallet_address AND responses.status = 'confirmed'
LEFT JOIN rewards ON rewards.wallet_address = users.wallet_address
GROUP BY users.id, users.wallet_address, users.reputation
ORDER BY users.reputation DESC;

-- ============================================
-- SAMPLE DATA (Optional - for demo purposes)
-- Uncomment to insert sample data
-- ============================================
/*
-- Insert sample users
INSERT INTO users (wallet_address, reputation) VALUES
  ('demo-alice.near', 25),
  ('demo-bob.near', 15),
  ('demo-charlie.near', 10)
ON CONFLICT (wallet_address) DO NOTHING;

-- Insert sample requests
INSERT INTO emergency_requests (requester_wallet, request_type, description, geohash, status) VALUES
  ('demo-alice.near', '💊 Medication', 'Need insulin, urgent', 'dr5r9x', 'open'),
  ('demo-bob.near', '🏥 Medical Supplies', 'Need bandages for wound', 'dr5r9y', 'open')
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- END OF SCHEMA
-- ============================================
