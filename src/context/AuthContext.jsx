import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSession, onAuthChange } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setIsAuthReady(true);
      }
    });

    const unsubscribe = onAuthChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      isAuthReady,
      session,
      user: session?.user ?? null
    }),
    [isAuthReady, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa estar dentro de AuthProvider.");
  }

  return context;
}
