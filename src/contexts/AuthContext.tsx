
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Starting sign up process for:', email);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        
        // Handle specific error cases with user-friendly messages
        if (error.message?.includes('User already registered')) {
          return { error: { ...error, message: 'An account with this email already exists. Please try signing in instead.' } };
        }
        if (error.message?.includes('email_address_invalid')) {
          return { error: { ...error, message: 'Please enter a valid email address.' } };
        }
        if (error.message?.includes('Password should be')) {
          return { error: { ...error, message: 'Password must be at least 6 characters long.' } };
        }
        if (error.message?.includes('Signup is disabled')) {
          return { error: { ...error, message: 'Account registration is currently disabled. Please contact support.' } };
        }
        
        return { error };
      }

      if (data.user) {
        console.log('Sign up completed successfully for:', email);
        // The profile will be automatically created by the database trigger
        
        // If the user is immediately confirmed (no email verification), 
        // they'll be signed in automatically
        if (data.session) {
          console.log('User is immediately signed in');
        }
      }
      
      return { error: null };
    } catch (err: any) {
      console.error('Unexpected sign up error:', err);
      return { error: { message: err.message || 'An unexpected error occurred during sign up' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Starting sign in process for:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
        
        // Handle specific error cases with user-friendly messages
        if (error.message?.includes('Invalid login credentials')) {
          return { error: { ...error, message: 'Invalid email or password. Please check your credentials and try again.' } };
        }
        if (error.message?.includes('Email not confirmed')) {
          return { error: { ...error, message: 'Please check your email to confirm your account before signing in.' } };
        }
        if (error.message?.includes('Too many requests')) {
          return { error: { ...error, message: 'Too many login attempts. Please wait a moment before trying again.' } };
        }
        
        return { error };
      }

      if (data.user) {
        console.log('Sign in successful for:', email);
        
        // Verify that the user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Creating missing profile for user:', data.user.id);
          const { error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || 'User'
              }
            ]);
            
          if (createError) {
            console.error('Error creating profile:', createError);
          }
        }
      }
      
      return { error: null };
    } catch (err: any) {
      console.error('Unexpected sign in error:', err);
      return { error: { message: err.message || 'An unexpected error occurred during sign in' } };
    }
  };

  const signOut = async () => {
    console.log('Starting sign out process');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
        // Clear local state
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
