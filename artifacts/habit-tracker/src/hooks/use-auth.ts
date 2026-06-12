import { useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function useAuth(options: { requireAuth?: boolean; requireGuest?: boolean } = {}) {
  const { requireAuth = false, requireGuest = false } = options;
  const { data: user, isLoading, error } = useGetMe({ query: { retry: false } });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && error) {
      setLocation("/login");
    }

    if (requireGuest && user) {
      setLocation("/");
    }
  }, [user, isLoading, error, requireAuth, requireGuest, setLocation]);

  return { user, isLoading, error };
}
