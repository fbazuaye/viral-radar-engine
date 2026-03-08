import { FunctionsHttpError } from "@supabase/supabase-js";

/**
 * Extract the actual error message from a Supabase edge function error.
 * supabase.functions.invoke returns a generic "Edge Function returned a non-2xx status code"
 * but the real message is in the response body.
 */
export async function extractEdgeFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error) return body.error;
    } catch {
      // fallback
    }
  }
  if (error instanceof Error) return error.message;
  return "An unknown error occurred";
}
