
CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  country text,
  city text,
  device_type text NOT NULL DEFAULT 'unknown',
  browser text NOT NULL DEFAULT 'unknown',
  referrer text,
  user_id uuid,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (tracked via edge function with service role, but allow public insert too)
CREATE POLICY "Service can insert visits" ON public.site_visits
  FOR INSERT TO public
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view all visits" ON public.site_visits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
