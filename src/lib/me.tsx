import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMe, type Me } from "@/lib/stella-api";

const MeContext = createContext<{
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
}>({ me: null, loading: false, refresh: async () => {} });

export function MeProvider({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const meRef = useRef<Me | null>(null);
  meRef.current = me;

  const refresh = useCallback(async () => {
    if (!user) {
      setMe(null);
      setLoading(false);
      return;
    }
    if (!meRef.current) setLoading(true);
    try {
      const next = await getMe();
      setMe(next);
    } catch {
      if (!meRef.current) setMe(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isPending) return;
    void refresh();
  }, [isPending, refresh]);

  return (
    <MeContext.Provider value={{ me, loading: isPending || (loading && !me), refresh }}>
      {children}
    </MeContext.Provider>
  );
}

export function useMe() {
  return useContext(MeContext);
}
