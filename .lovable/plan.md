

## Plan: Fix Thumbnail Display — Full Image Visibility

### Problem
Two issues cause faces to be cut off:

1. **Fixed-height container** (`h-40` = 160px): The thumbnail card image container is a fixed 160px tall with `object-cover`, which crops the image to fill the box — cutting off faces and other important content.

2. **AI prompt doesn't enforce aspect ratio strongly enough**: The image generation prompt requests 1280×720 but the model may return different dimensions.

### Solution

**File: `src/pages/Thumbnails.tsx`**

1. **Replace fixed-height container with aspect-ratio container**: Change `h-40` to `aspect-video` (16:9) so images display at their natural proportions without cropping.
   - Change `object-cover` to `object-contain` as a fallback so nothing gets cropped even if the AI returns a non-16:9 image.
   - Apply this to both the main grid thumbnails and the history preview thumbnails.

2. **Update the history mini-previews**: Change `h-20` fixed containers to `aspect-video` as well.

**File: `supabase/functions/generate-thumbnails/index.ts`**

3. **Strengthen the image prompt**: Add explicit instructions like "The image MUST be landscape orientation, 16:9 aspect ratio. Show full body and face of any people — do not crop heads or faces. Ensure all subjects are fully visible within frame."

### Files Changed
- `src/pages/Thumbnails.tsx` — aspect-ratio containers, `object-contain`
- `supabase/functions/generate-thumbnails/index.ts` — stronger prompt for full-frame composition

