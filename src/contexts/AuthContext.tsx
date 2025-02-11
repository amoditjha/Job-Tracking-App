
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserDetails {
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  userDetails: UserDetails | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const navigate = useNavigate();
  const fetchUserDetails = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();
  
    if (!error && data) {
      const firstName = data.full_name.split(" ")[0]; // ✅ Extract first name
      setUserDetails({ full_name: firstName }); // ✅ Store only first name
    }
  };

  useEffect(() => {


    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserDetails(session.user.id);
      } else {
        navigate('/login');
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserDetails(session.user.id);
      } else {
        setUserDetails(null);
        navigate('/login');
      }
      // console.log(subscription)
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;

    if (data.user) {
      // Insert user details in `users` table
      const { error: userError } = await supabase.from('users').insert([
        {
          id: data.user.id,
          email,
          full_name: name,
        },
      ]);

      if (userError) throw userError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await fetchUserDetails(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUserDetails(null);
  };

  return (
    <AuthContext.Provider value={{ user, userDetails, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
