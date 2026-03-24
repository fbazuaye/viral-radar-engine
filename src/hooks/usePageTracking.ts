import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  let id = sessionStorage.getItem("visit_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("visit_session_id", id);
  }
  return id;
}

export const usePageTracking = () => {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const track = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      supabase.functions.invoke("track-visit", {
        body: {
          page_path: path,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          session_id: getSessionId(),
          user_id: session?.user?.id || null,
        },
      });
    };

    track();
  }, [location.pathname]);
};
