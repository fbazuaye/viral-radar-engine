-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  youtube_channel_id TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'agency')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Channels table
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  subscriber_count BIGINT DEFAULT 0,
  view_count BIGINT DEFAULT 0,
  video_count INT DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own channels" ON public.channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own channels" ON public.channels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own channels" ON public.channels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own channels" ON public.channels FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  comment_count BIGINT DEFAULT 0,
  published_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view videos of own channels" ON public.videos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.channels WHERE channels.id = videos.channel_id AND channels.user_id = auth.uid())
);
CREATE POLICY "Users can insert videos for own channels" ON public.videos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.channels WHERE channels.id = videos.channel_id AND channels.user_id = auth.uid())
);

-- Keywords table
CREATE TABLE public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  search_volume BIGINT DEFAULT 0,
  competition_score NUMERIC(3,2) DEFAULT 0,
  trend_direction TEXT DEFAULT 'stable' CHECK (trend_direction IN ('rising', 'stable', 'declining')),
  related_keywords TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Keywords are viewable by authenticated users" ON public.keywords FOR SELECT TO authenticated USING (true);

-- Trends table
CREATE TABLE public.trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  category TEXT,
  trend_score NUMERIC(5,2) DEFAULT 0,
  velocity NUMERIC(5,2) DEFAULT 0,
  region TEXT DEFAULT 'global',
  source TEXT DEFAULT 'youtube',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trends are viewable by authenticated users" ON public.trends FOR SELECT TO authenticated USING (true);

-- Predictions table (Viral Radar)
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  trend_probability NUMERIC(5,2) NOT NULL,
  competition_score NUMERIC(5,2) DEFAULT 0,
  suggested_idea TEXT,
  time_window TEXT DEFAULT '24-72h',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Predictions are viewable by authenticated users" ON public.predictions FOR SELECT TO authenticated USING (true);

-- Insights table
CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('title', 'idea', 'script', 'thumbnail', 'content_gap')),
  input_text TEXT,
  output_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own insights" ON public.insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON public.insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Competitors table
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  subscriber_count BIGINT DEFAULT 0,
  avg_views BIGINT DEFAULT 0,
  top_video_title TEXT,
  top_video_views BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own competitors" ON public.competitors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own competitors" ON public.competitors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own competitors" ON public.competitors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own competitors" ON public.competitors FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON public.competitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();