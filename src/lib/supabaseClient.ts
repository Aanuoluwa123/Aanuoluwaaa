// Add TypeScript interface for import.meta.env
interface ImportMetaEnv {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    [key: string]: any;
}

interface ImportMeta {
    env: ImportMetaEnv;
}

import { createClient } from '@supabase/supabase-js';

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

// Get Supabase credentials from environment variables
// @ts-ignore - Vite-specific environment variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
// @ts-ignore - Vite-specific environment variables
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-key';

// Log configuration status (only in development)
if (isDevelopment) {
    if (hasValidCredentials) {
        console.log('✅ Supabase credentials loaded successfully');
    } else {
        console.warn('⚠️ Using placeholder Supabase credentials. For full functionality:');
        console.warn('1. Create a .env file in the project root');
        console.warn('2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables');
        console.warn('3. Restart the development server');
    }
}

// Create and export the Supabase client
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

// Export helper function to check if we're using real credentials
export const isUsingRealSupabase = () => hasValidCredentials;

// Export development mode status
export const isDevEnvironment = () => isDevelopment;