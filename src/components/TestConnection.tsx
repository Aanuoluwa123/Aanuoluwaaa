import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const TestConnection: React.FC = () => {
  const [status, setStatus] = useState('Checking connection...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('TestConnection component mounted');
    
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        setStatus('Testing Supabase connection...');

        // 1. Test if Supabase is initialized
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        // 2. Test auth endpoint
        console.log('Testing auth endpoint...');
        const { data: authData, error: authError } = await supabase.auth.getSession();
        console.log('Auth response:', { authData, authError });
        
        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }
        
        // 3. Test database connection
        console.log('Testing database connection...');
        const { data, error: dbError } = await supabase
          .from('transactions')
          .select('*')
          .limit(1);
        
        console.log('Database response:', { data, dbError });
        
        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }
        
        setStatus('✅ Connected to Supabase successfully!');
        setError(null);
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error';
        console.error('TestConnection error:', err);
        setStatus('❌ Connection failed');
        setError(errorMessage);
      }
    };
    
    testConnection();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg my-4">
      <h3 className="font-bold text-lg mb-2">Supabase Connection Test</h3>
      <p className="mb-2">{status}</p>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-2">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <p className="text-sm text-gray-600 mt-2">
        Check browser console (F12) for detailed connection information.
      </p>
    </div>
  );
};
