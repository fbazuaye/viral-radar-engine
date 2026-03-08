

## Plan: Add AI-Generated Thumbnail Images

Currently the Thumbnail Generator returns text-only concepts with a placeholder icon. We'll enhance it to also generate an actual image for each concept using the Gemini image generation model.

### Approach

1. **Create a new edge function `generate-thumbnail-image`** that takes a visual description and generates an image using `google/gemini-2.5-flash-image` with `modalities: ["image", "text"]`. The returned base64 image will be uploaded to a Supabase storage bucket and a public URL returned.

2. **Create a storage bucket `thumbnail-images`** (public) via migration, with RLS policy allowing authenticated users to upload and anyone to read.

3. **Update `generate-thumbnails` edge function** to call the image generation endpoint for each of the 4 concepts after generating the text concepts. Each image is uploaded to the storage bucket and the URL is added to the response.

4. **Update `src/pages/Thumbnails.tsx`** to display the generated images in place of the placeholder icon, with a loading skeleton while images generate.

### Technical Details

- **Edge function flow**: Generate text concepts first (existing logic), then loop through each concept and generate an image using the description + style as the prompt. Upload each base64 image to `thumbnail-images/{userId}/{timestamp}-{index}.png`. Return concept objects with an added `imageUrl` field.
- **Storage bucket**: Public bucket `thumbnail-images` with insert policy for authenticated users and select for all.
- **Token cost**: Keep at 5 tokens total (image generation is included). Alternatively increase to 10 since image generation is more expensive — will keep at 5 for now.
- **Frontend**: Add `imageUrl?: string` to `ThumbnailConcept`. Show `<img>` when available, fall back to the icon placeholder. Add a loading state per card.

### Files to Create/Modify

- **New migration**: Create `thumbnail-images` storage bucket with RLS policies
- **`supabase/functions/generate-thumbnails/index.ts`**: Add image generation loop after text concept generation, upload to storage, return URLs
- **`src/pages/Thumbnails.tsx`**: Display images, update interface, add loading skeleton

