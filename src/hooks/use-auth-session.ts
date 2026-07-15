import { useEffect, useState } from "react";
import {
  authSessionChangedEvent,
  getStoredAuthSession,
  restoreAuthSession,
  type AuthSession,
} from "@/lib/auth-api";

export function useAuthSession(): AuthSession | null | undefined {
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const syncSession = () => setSession(getStoredAuthSession());
    window.addEventListener(authSessionChangedEvent, syncSession);
    window.addEventListener("storage", syncSession);

    restoreAuthSession().then((restoredSession) => {
      if (active) setSession(restoredSession);
    });

    return () => {
      active = false;
      window.removeEventListener(authSessionChangedEvent, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  return session;
}
