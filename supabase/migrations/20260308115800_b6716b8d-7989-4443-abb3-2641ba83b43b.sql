
-- Create the thumbnail-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnail-images', 'thumbnail-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload thumbnail images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'thumbnail-images');

-- Allow anyone to view
CREATE POLICY "Anyone can view thumbnail images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'thumbnail-images');

-- Allow users to delete their own thumbnails
CREATE POLICY "Users can delete their own thumbnail images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'thumbnail-images' AND (storage.foldername(name))[1] = auth.uid()::text);
