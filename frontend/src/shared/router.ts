import { useCallback, useEffect, useMemo, useState } from "react";

export function navigate(path: string) {
  if (window.location.pathname === path) return;
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const go = useCallback((nextPath: string) => navigate(nextPath), []);

  return useMemo(() => ({ path, navigate: go }), [go, path]);
}

export function routeParam(path: string, prefix: string) {
  if (!path.startsWith(prefix)) return null;
  const value = path.slice(prefix.length).split("/")[0];
  return value || null;
}
