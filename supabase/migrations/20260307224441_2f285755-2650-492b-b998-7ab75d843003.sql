
-- Token balances table
CREATE TABLE public.token_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balance" ON public.token_balances
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own balance" ON public.token_balances
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Token transactions table
CREATE TABLE public.token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  action_type text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.token_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Deduct tokens function (security definer, atomic)
CREATE OR REPLACE FUNCTION public.deduct_tokens(
  _user_id uuid,
  _amount integer,
  _action_type text,
  _description text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
BEGIN
  SELECT balance INTO current_balance
  FROM public.token_balances
  WHERE user_id = _user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < _amount THEN
    RETURN false;
  END IF;

  UPDATE public.token_balances
  SET balance = balance - _amount, updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.token_transactions (user_id, amount, action_type, description)
  VALUES (_user_id, -_amount, _action_type, _description);

  RETURN true;
END;
$$;

-- Grant tokens function (for monthly grants and purchases)
CREATE OR REPLACE FUNCTION public.grant_tokens(
  _user_id uuid,
  _amount integer,
  _action_type text,
  _description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.token_balances (user_id, balance)
  VALUES (_user_id, _amount)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = token_balances.balance + _amount, updated_at = now();

  INSERT INTO public.token_transactions (user_id, amount, action_type, description)
  VALUES (_user_id, _amount, _action_type, _description);
END;
$$;

-- Update handle_new_user to also create token balance with free tier tokens
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO public.token_balances (user_id, balance)
  VALUES (NEW.id, 50);
  
  INSERT INTO public.token_transactions (user_id, amount, action_type, description)
  VALUES (NEW.id, 50, 'signup_grant', 'Welcome bonus: 50 free tokens');
  
  RETURN NEW;
END;
$$;
