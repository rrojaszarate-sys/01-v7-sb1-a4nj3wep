import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
❌ Missing Supabase Environment Variables

Please configure your Supabase credentials:
1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to Settings > API
4. Copy the "Project URL" and "anon public" key
5. Update your .env file with these values:
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
6. Restart your development server

Current values:
- VITE_SUPABASE_URL: ${supabaseUrl || 'Not set'}
- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Present' : 'Not set'}
  `;
  
  console.error(errorMessage);
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);