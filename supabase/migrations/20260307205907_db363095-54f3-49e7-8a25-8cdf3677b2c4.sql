
-- Add unique constraint for channel upsert
ALTER TABLE public.channels ADD CONSTRAINT channels_channel_id_user_id_key UNIQUE (channel_id, user_id);

-- Add delete policy for videos (needed for re-sync)
CREATE POLICY "Users can delete videos of own channels"
ON public.videos
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM channels WHERE channels.id = videos.channel_id AND channels.user_id = auth.uid()
));

-- Add update policy for videos
CREATE POLICY "Users can update videos of own channels"
ON public.videos
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM channels WHERE channels.id = videos.channel_id AND channels.user_id = auth.uid()
));
