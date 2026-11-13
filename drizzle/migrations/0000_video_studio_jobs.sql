CREATE TABLE public.studio_clips (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 request_id uuid NOT NULL, prompt text NOT NULL, aspect_ratio text NOT NULL CHECK (aspect_ratio IN ('16:9','9:16')),
 duration integer NOT NULL CHECK (duration BETWEEN 3 AND 10), resolution text NOT NULL CHECK (resolution IN ('360p','720p','1080p')),
 kind text NOT NULL CHECK (kind IN ('b-roll','clip')), status text NOT NULL DEFAULT 'queued',
 gateway_id text, progress integer NOT NULL DEFAULT 0, storage_path text, error_message text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,request_id)
);
GRANT SELECT ON public.studio_clips TO authenticated;
GRANT ALL ON public.studio_clips TO service_role;
ALTER TABLE public.studio_clips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read clips" ON public.studio_clips FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX studio_clips_user_created ON public.studio_clips(user_id,created_at DESC);
CREATE TABLE public.studio_service_state (id text PRIMARY KEY, status integer NOT NULL, message text NOT NULL, provider_denied boolean NOT NULL DEFAULT false);
GRANT ALL ON public.studio_service_state TO service_role;
ALTER TABLE public.studio_service_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read video files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'studio-clips' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE FUNCTION public.claim_studio_clip(_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(762914);
 IF EXISTS(SELECT 1 FROM public.studio_service_state WHERE id = 'gemini-video') THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.studio_clips WHERE status IN ('starting','in_progress') AND id <> _id) THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.studio_clips WHERE status='queued' AND created_at < (SELECT created_at FROM public.studio_clips WHERE id=_id)) THEN RETURN false; END IF;
 UPDATE public.studio_clips SET status='starting',updated_at=now() WHERE id=_id AND status='queued';
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_studio_clip(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_studio_clip(uuid) TO service_role;