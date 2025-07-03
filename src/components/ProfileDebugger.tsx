
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

const ProfileDebugger: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Checking profile for user:', user.id);
      
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setError(profileError.message);
        
        // If profile doesn't exist, create it manually
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, creating manually...');
          await createProfileManually();
        }
      } else {
        console.log('Profile found:', data);
        setProfile(data);
      }
    } catch (err: any) {
      console.error('Error checking profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createProfileManually = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.user_metadata?.full_name || 'User'
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating profile manually:', error);
        setError(`Failed to create profile: ${error.message}`);
      } else {
        console.log('Profile created manually:', data);
        setProfile(data);
        setError(null);
      }
    } catch (err: any) {
      console.error('Manual profile creation error:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (user) {
      checkProfile();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold text-gray-700">Profile Debug Info</h3>
        <p className="text-sm text-gray-600">No authenticated user</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg space-y-3">
      <h3 className="font-semibold text-gray-700">Profile Debug Info</h3>
      
      <div className="text-sm space-y-1">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
        <p><strong>Created At:</strong> {user.created_at}</p>
      </div>

      <div className="text-sm space-y-1">
        <p><strong>Profile Status:</strong></p>
        {loading && <p className="text-blue-600">Loading...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {profile && (
          <div className="bg-green-50 p-2 rounded">
            <p className="text-green-700">Profile found!</p>
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Created:</strong> {new Date(profile.created_at).toLocaleString()}</p>
          </div>
        )}
      </div>

      <button
        onClick={checkProfile}
        disabled={loading}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Checking...' : 'Refresh Profile'}
      </button>
      
      <button
        onClick={createProfileManually}
        disabled={loading}
        className="ml-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
      >
        Create Profile
      </button>
    </div>
  );
};

export default ProfileDebugger;
