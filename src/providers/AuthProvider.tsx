import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

import type { ProfileRole } from '../types';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: ProfileRole;
  avatar_url: string | null;
  phone: string | null;
  notify_new_orders?: boolean;
  notify_approved_quotes?: boolean;
  notify_delivery_reminder?: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  authError: string | null;
  signIn: (params: { email: string; password: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, phone, notify_new_orders, notify_approved_quotes, notify_delivery_reminder')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setProfile(null);
      setAuthError(error.message);
      return;
    }

    if (!data) {
      setProfile(null);
      return;
    }
    setProfile(data as unknown as UserProfile);
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (!isMounted) {
          return;
        }
        if (error) {
          setAuthError(error.message);
        }
        setSession(session);
        if (session?.user) {
          void loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error ? error.message : 'Não foi possível carregar a sessão atual.';
          setAuthError(message);
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setAuthError(null);
      if (newSession?.user) {
        void loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      if (event === 'INITIAL_SESSION') {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue['signIn'] = async ({ email, password }) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      authError,
      signIn,
      signOut,
      refreshProfile: async () => {
        if (session?.user) {
          await loadProfile(session.user.id);
        }
      },
    }),
    [session, profile, isLoading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
