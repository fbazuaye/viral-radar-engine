
-- Drop the restrictive status check constraint
ALTER TABLE public.predictions DROP CONSTRAINT IF EXISTS predictions_status_check;

-- Add scanned_at column to trends
ALTER TABLE public.trends ADD COLUMN IF NOT EXISTS scanned_at timestamptz NOT NULL DEFAULT now();

-- Add scanned_at column to predictions
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS scanned_at timestamptz NOT NULL DEFAULT now();
