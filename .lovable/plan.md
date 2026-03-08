

## Plan: Add AI-Generated Thumbnail Images

The previous attempt failed because it used `google/gemini-3-pro-image-preview` which didn't return image data as expected. The correct approach per the AI gateway docs is to use `google/gemini-2.5-flash-image` with `modalities: ["image", "text"]` — the response includes an `images` array with base64-encoded data.

### Approach

**Two-phase generation** in the edge function:

1. **Phase 1** (existing): Generate 4 text concepts using `gemini-3-flash-preview` with tool calling (keep as-is).
2. **Phase 2** (new): For each concept, call `gemini-2.5-flash-image` with `modalities: ["image", "text"]` using the concept's description as the prompt. Upload the returned base64 image to the `thumbnail-images` storage bucket. Add the public URL to each concept.

### Key difference from previous attempt

The response format for `gemini-2.5-flash-image` returns images in `choices[0].message.images[0].image_url.url` as a `data:image/png;base64,...` string — NOT in tool calls or content. This is the correct extraction path.

### Files to modify

1. **`supabase/functions/generate-thumbnails/index.ts`**
   - After generating text concepts, loop through each and call the image model
   - Extract base64 from `data.choices[0].message.images[0].image_url.url`
   - Strip the `data:image/png;base64,` prefix, decode, upload to `thumbnail-images` bucket
   - Attach the public URL to each concept object
   - Generate images in parallel (Promise.all) for speed

2. **`src/pages/Thumbnails.tsx`**
   - Show `<img>` when `imageUrl` is present, fall back to placeholder icon
   - Add download button (hover overlay) that fetches the image as blob and triggers download
   - Loading message updated to indicate image generation takes longer

### Token cost
Kept at 5 tokens (unchanged).

