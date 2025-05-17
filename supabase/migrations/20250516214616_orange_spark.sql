/*
  # Financial Tracker Schema

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `description` (text)
      - `amount` (decimal)
      - `type` (text, either 'income' or 'expense')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `transactions` table
    - Add policies for users to manage their own transactions
*/

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  description text NOT NULL,
  amount decimal NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

/*
  # Financial Tracker Schema Updates

  1. Add indexes to improve query performance
  2. Add created_by field to track which user created each record
*/

-- Add indexes to improve query performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);

-- Add a function to get monthly spending by category
CREATE OR REPLACE FUNCTION get_monthly_spending(user_uuid UUID, year INT, month INT)
RETURNS TABLE (
  category_name TEXT,
  category_id UUID,
  total NUMERIC,
  budget_limit NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name as category_name,
    c.id as category_id,
    COALESCE(SUM(t.amount), 0) as total,
    c.budget_limit
  FROM 
    categories c
  LEFT JOIN 
    transactions t ON c.id = t.category_id 
    AND t.type = 'expense'
    AND EXTRACT(YEAR FROM t.created_at) = year
    AND EXTRACT(MONTH FROM t.created_at) = month
  WHERE 
    c.user_id = user_uuid
    AND c.type = 'expense'
  GROUP BY 
    c.id, c.name, c.budget_limit
  ORDER BY 
    c.name;
END;
$$ LANGUAGE plpgsql;