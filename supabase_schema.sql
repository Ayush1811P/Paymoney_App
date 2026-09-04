-- 1. Create 'profiles' table
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    upi_id TEXT UNIQUE,
    upi_pin TEXT,
    password_hash TEXT NOT NULL,
    wallet_balance NUMERIC(10, 2) DEFAULT 20000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Create 'bank_accounts' table (for the accounts linked via UPI)
CREATE TABLE bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bank_name TEXT DEFAULT 'Bank',
    account_number TEXT NOT NULL UNIQUE,
    ifsc_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Create 'transactions' table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    transaction_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- (Optional) Add Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Enable insert for everyone" ON profiles FOR INSERT WITH CHECK (true);
-- SECURITY PATCH: Public insert policy removed to prevent OTP bypass. Profiles must be created by the backend service role.
CREATE POLICY "Enable select for users based on id" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable update for users based on id" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Enable all for users based on user_id" ON bank_accounts FOR ALL USING (true);
CREATE POLICY "Enable all for sender and receiver" ON transactions FOR ALL USING (true);

-- 4. Create 'otp_verifications' table for secure backend email verification
CREATE TABLE otp_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    attempts INT DEFAULT 0,
    last_request_time TIMESTAMP WITH TIME ZONE,
    request_count INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(email, operation_type)
);

-- Note: otp_verifications should NOT have RLS policies enabling public access, 
-- as it should only be accessed by the backend service role.
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- 5. Create atomic rate limiting function
CREATE OR REPLACE FUNCTION generate_and_save_otp(p_email TEXT, p_operation TEXT, p_hash TEXT, p_expires_at TIMESTAMP WITH TIME ZONE)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_record record;
    v_now TIMESTAMP WITH TIME ZONE := timezone('utc', now());
    v_time_diff INTERVAL;
    v_request_count INT;
BEGIN
    -- Advisory lock to prevent insert race conditions for the same email/operation
    PERFORM pg_advisory_xact_lock(hashtext(p_email || p_operation));

    SELECT * INTO v_record FROM otp_verifications WHERE email = p_email AND operation_type = p_operation;

    IF FOUND THEN
        IF v_record.last_request_time IS NOT NULL THEN
            v_time_diff := v_now - v_record.last_request_time;
            
            -- 60-second cooldown check
            IF v_time_diff < interval '60 seconds' THEN
                RETURN json_build_object('allowed', false, 'error', 'Please wait 60 seconds before requesting another OTP');
            END IF;

            -- 1-hour rolling limit check
            IF v_time_diff > interval '1 hour' THEN
                v_request_count := 1;
            ELSE
                IF v_record.request_count >= 5 THEN
                    RETURN json_build_object('allowed', false, 'error', 'Too many requests. Please try again later.');
                END IF;
                v_request_count := v_record.request_count + 1;
            END IF;
        ELSE
            v_request_count := 1;
        END IF;

        UPDATE otp_verifications SET 
            otp_hash = p_hash,
            attempts = 0,
            last_request_time = v_now,
            request_count = v_request_count,
            expires_at = p_expires_at
        WHERE email = p_email AND operation_type = p_operation;
    ELSE
        v_request_count := 1;
        INSERT INTO otp_verifications (email, operation_type, otp_hash, attempts, last_request_time, request_count, expires_at)
        VALUES (p_email, p_operation, p_hash, 0, v_now, v_request_count, p_expires_at);
    END IF;

    RETURN json_build_object('allowed', true, 'request_count', v_request_count);
END;
$$;

-- 6. Create atomic verify attempt function
CREATE OR REPLACE FUNCTION verify_otp_attempt(p_email TEXT, p_operation TEXT, p_input_hash TEXT)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_record record;
    v_new_attempts INT;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(p_email || p_operation));

    SELECT * INTO v_record FROM otp_verifications WHERE email = p_email AND operation_type = p_operation;

    IF NOT FOUND THEN
        RETURN json_build_object('valid', false, 'error', 'Invalid or expired OTP');
    END IF;

    IF timezone('utc', now()) > v_record.expires_at THEN
        RETURN json_build_object('valid', false, 'error', 'OTP has expired');
    END IF;

    IF v_record.otp_hash <> p_input_hash THEN
        v_new_attempts := COALESCE(v_record.attempts, 0) + 1;
        
        IF v_new_attempts >= 3 THEN
            DELETE FROM otp_verifications WHERE email = p_email AND operation_type = p_operation;
            RETURN json_build_object('valid', false, 'error', 'Too many incorrect attempts. Please request a new OTP.');
        ELSE
            UPDATE otp_verifications SET attempts = v_new_attempts WHERE email = p_email AND operation_type = p_operation;
            RETURN json_build_object('valid', false, 'error', 'Invalid OTP. ' || (3 - v_new_attempts) || ' attempts remaining.');
        END IF;
    END IF;

    -- Valid OTP! Delete it to prevent reuse.
    DELETE FROM otp_verifications WHERE email = p_email AND operation_type = p_operation;
    RETURN json_build_object('valid', true);
END;
$$;
