-- =====================================================
-- Flyway Migration V3: Payment System Enhancement
-- =====================================================
-- Purpose: Add indexes and optimize Payment entity queries
-- Created: 2024
-- =====================================================

-- Add indexes for frequently queried payment columns
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(status);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON payment(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_order_id ON payment(order_id);

-- Add indexes for refund queries
CREATE INDEX IF NOT EXISTS idx_payment_refundate ON payment(refunded_at);

-- Add index for payment method queries
CREATE INDEX IF NOT EXISTS idx_payment_method ON payment(payment_method);

-- Add index for audit trail (user who initiated payment)
-- This helps track which users initiated payments for security/fraud analysis
CREATE INDEX IF NOT EXISTS idx_order_user_id ON "order"(user_id);

-- Add check constraint to ensure refund amount doesn't exceed payment amount
ALTER TABLE payment 
ADD CONSTRAINT chk_refund_amount_valid 
CHECK (refund_amount IS NULL OR refund_amount <= amount);

-- Add constraint to ensure paid_at is after created_at
ALTER TABLE payment
ADD CONSTRAINT chk_paid_after_created
CHECK (paid_at IS NULL OR paid_at >= created_at);

-- Add constraint for status transitions (basic validation)
-- In production, this business logic should be in application layer
ALTER TABLE payment
ADD CONSTRAINT chk_valid_status_transitions
CHECK (
  -- PENDING can move to COMPLETED or FAILED
  -- COMPLETED can move to REFUNDED or PARTIALLY_REFUNDED
  -- FAILED stays FAILED (can be retried with new transaction)
  -- REFUNDED can stay REFUNDED
  (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'))
);

-- Create a view for payment summary for reporting
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
  p.id,
  p.order_id,
  o.order_number,
  u.email as user_email,
  v.name as vendor_name,
  p.amount,
  p.refund_amount,
  COALESCE(p.amount - COALESCE(p.refund_amount, 0), p.amount) as net_amount,
  p.status,
  p.payment_method,
  p.created_at,
  p.paid_at,
  p.refunded_at,
  CASE 
    WHEN p.status = 'COMPLETED' THEN 'Paid'
    WHEN p.status = 'REFUNDED' THEN 'Refunded'
    WHEN p.status = 'PARTIALLY_REFUNDED' THEN 'Partially Refunded'
    WHEN p.status = 'FAILED' THEN 'Failed'
    ELSE 'Pending'
  END as status_display
FROM payment p
JOIN "order" o ON p.order_id = o.id
JOIN "user" u ON o.user_id = u.id
LEFT JOIN vendor v ON o.vendor_id = v.id;

-- Create index on payment summary view for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_summary_status ON payment(status);
CREATE INDEX IF NOT EXISTS idx_payment_summary_created_at ON payment(created_at DESC);

-- Grant appropriate permissions (adjust based on your security model)
-- GRANT SELECT ON payment_summary TO app_read_role;
-- GRANT INSERT, UPDATE ON payment TO app_write_role;

-- Logging message
-- Migration complete: Optimized payment queries and added status constraints
