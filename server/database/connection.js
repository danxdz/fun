import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create Supabase client with error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL environment variable is required');
  }
  
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required');
  }
  
  supabase = createClient(process.env.SUPABASE_URL, supabaseKey);
} catch (error) {
  console.error('Failed to create Supabase client:', error.message);
  // Create a mock client for development
  supabase = {
    from: () => ({
      select: () => ({ limit: () => ({ data: null, error: error }) })
    })
  };
}

export { supabase };

// Legacy sequelize export for compatibility (will be removed)
export const sequelize = {
  authenticate: async () => {
    try {
      const { data, error } = await supabase.from('Users').select('count').limit(1);
      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
  },
  sync: async () => {
    // Supabase tables are managed via SQL, no sync needed
    return true;
  },
  getDatabaseName: () => 'supabase',
  getDialect: () => 'supabase',
  getHostname: () => process.env.SUPABASE_URL,
  getPort: () => 443,
  query: async (sql) => {
    // For simple queries, we'll use Supabase
    if (sql.includes('SELECT 1')) {
      return [{ test: 1 }];
    }
    throw new Error('Complex SQL queries not supported in Supabase-only mode');
  }
};