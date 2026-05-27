## Plan to fix Channel Sync

1. **Make the frontend show the real backend error**
   - Update `src/hooks/useYouTubeSync.ts` to use the existing `extractEdgeFunctionError` helper, matching the Viral Topic Finder behavior.
   - This will replace the vague “Edge Function returned a non-2xx status code” message with the actual cause from the function response.

2. **Harden the `youtube-sync` backend function**
   - Replace fragile auth claim parsing with the same reliable user lookup pattern used by `youtube-search`.
   - Use the service backend client for database writes, while still tying all saved channel/video data to the logged-in user.
   - Add clear checks for YouTube API failures on channel lookup, handle lookup, search, and video stats so blocked keys/quota/channel issues return useful messages.
   - Improve YouTube channel input parsing for common formats like `@handle`, `/channel/ID`, `/c/name`, `/user/name`, and pasted URLs.

3. **Deploy and validate**
   - Deploy the updated `youtube-sync` function.
   - Test the deployed function directly with a sample channel input.
   - Confirm any remaining failure reports the exact YouTube/API/auth reason instead of the generic edge-function error.

No database migration is needed for this fix.