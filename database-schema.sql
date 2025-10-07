-- FlowBudget Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security (RLS) for all tables
-- Create the transactions table with proper indexing
CREATE TABLE IF NOT EXISTS flowbudget_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('incomes', 'expenses')),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_flowbudget_transactions_user_id ON flowbudget_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_flowbudget_transactions_date ON flowbudget_transactions(date);
CREATE INDEX IF NOT EXISTS idx_flowbudget_transactions_type ON flowbudget_transactions(type);
CREATE INDEX IF NOT EXISTS idx_flowbudget_transactions_status ON flowbudget_transactions(status);
CREATE INDEX IF NOT EXISTS idx_flowbudget_transactions_user_date ON flowbudget_transactions(user_id, date);

-- Enable Row Level Security
ALTER TABLE flowbudget_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only access their own data
CREATE POLICY "Users can view their own transactions" ON flowbudget_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON flowbudget_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON flowbudget_transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON flowbudget_transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_flowbudget_transactions_updated_at
    BEFORE UPDATE ON flowbudget_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for easier querying (with RLS still applied)
CREATE OR REPLACE VIEW flowbudget_user_transactions AS
SELECT 
    id,
    user_id,
    type,
    category,
    description,
    amount,
    date,
    status,
    created_at,
    updated_at
FROM flowbudget_transactions
WHERE user_id = auth.uid();

-- Grant necessary permissions (these are usually set by default in Supabase)
GRANT ALL ON flowbudget_transactions TO authenticated;
GRANT ALL ON flowbudget_user_transactions TO authenticated;