import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

/**
 * Tipo unificado para roles (compatível com profiles e clients)
 */
export type UserRole = 'admin' | 'employee' | 'kitchen' | 'delivery' | 'client';

/**
 * Perfil do usuário carregado da tabela profiles (funcionários)
 */
export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  notify_new_orders?: boolean;
  notify_approved_quotes?: boolean;
  notify_delivery_reminder?: boolean;
}

/**
 * Perfil do cliente carregado da tabela clients (clientes da vitrine)
 */
export interface ClientProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: 'client' | 'employee' | 'admin';
  avatar_url: string | null;
  user_id: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  clientProfile: ClientProfile | null;
  isLoading: boolean;
  authError: string | null;
  isStaff: boolean;
  isClient: boolean;
  signIn: (params: { email: string; password: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Carrega perfil da tabela profiles (funcionários do admin)
   */
  const loadProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, phone, notify_new_orders, notify_approved_quotes, notify_delivery_reminder')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as unknown as UserProfile;
  };

  /**
   * Carrega perfil da tabela clients (clientes da vitrine)
   */
  const loadClientProfile = async (userId: string): Promise<ClientProfile | null> => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone, role, avatar_url, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role || 'client',
      avatar_url: data.avatar_url,
      user_id: data.user_id,
    };
  };

  /**
   * Carrega ambos os perfis (profile e clientProfile)
   */
  const loadAllProfiles = async (userId: string) => {
    try {
      // Carregar ambos em paralelo
      const [profileData, clientData] = await Promise.all([
        loadProfile(userId),
        loadClientProfile(userId),
      ]);

      setProfile(profileData);
      setClientProfile(clientData);

      // Se tiver client com role admin/employee, usar como fallback de profile
      if (!profileData && clientData && (clientData.role === 'admin' || clientData.role === 'employee')) {
        setProfile({
          id: clientData.id,
          full_name: clientData.name,
          email: clientData.email || '',
          role: clientData.role as UserRole,
          avatar_url: clientData.avatar_url,
          phone: clientData.phone,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar perfil';
      setAuthError(message);
    }
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
          await loadAllProfiles(session.user.id);
        } else {
          setProfile(null);
          setClientProfile(null);
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error ? error.message : 'Não foi possível carregar a sessão atual.';
          setAuthError(message);
          setSession(null);
          setProfile(null);
          setClientProfile(null);
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
        void loadAllProfiles(newSession.user.id);
      } else {
        setProfile(null);
        setClientProfile(null);
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
    setClientProfile(null);
    setSession(null);
  };

  // Verificações de role
  const isStaff = useMemo(() => {
    if (profile?.role === 'admin' || profile?.role === 'employee') return true;
    if (clientProfile?.role === 'admin' || clientProfile?.role === 'employee') return true;
    return false;
  }, [profile, clientProfile]);

  const isClient = useMemo(() => {
    return !!clientProfile && clientProfile.role === 'client';
  }, [clientProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      clientProfile,
      isLoading,
      authError,
      isStaff,
      isClient,
      signIn,
      signOut,
      refreshProfile: async () => {
        if (session?.user) {
          await loadAllProfiles(session.user.id);
        }
      },
    }),
    [session, profile, clientProfile, isLoading, authError, isStaff, isClient],
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
