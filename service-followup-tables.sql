-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Service Follow-up Rules Table
CREATE TABLE IF NOT EXISTS service_follow_up_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id TEXT UNIQUE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  triggering_service_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Follow-up Steps Table
CREATE TABLE IF NOT EXISTS follow_up_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_follow_up_rule_id UUID REFERENCES service_follow_up_rules(id) ON DELETE CASCADE,
  follow_up_service_id UUID,
  sequence INTEGER NOT NULL,
  interval_days INTEGER NOT NULL,
  suggested_service_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
