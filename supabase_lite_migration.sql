-- ==========================================================
-- PAYMONEY LITE ACCOUNT DATABASE MIGRATION
-- Safe, idempotent, and non-destructive for existing data.
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/romdfgbohhmswjtzphzj/sql/new
-- ==========================================================

-- 1. Add account_type column to profiles (default 'normal')
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'normal' 
CHECK (account_type IN ('normal', 'lite'));

-- 2. Add parent_id foreign key referencing profiles(id)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Add age column (constrained between 5 and 25 for Lite accounts)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age INT CHECK (age IS NULL OR (age >= 5 AND age <= 25));

-- 4. Create performance index for parent-child relationships
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON profiles(parent_id);

-- 5. Backfill any existing accounts without an account_type to 'normal'
UPDATE profiles 
SET account_type = 'normal' 
WHERE account_type IS NULL;

-- 6. Add performance index on phone and upi_id if not present
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_upi_id ON profiles(upi_id);

-- Migration completed successfully.
