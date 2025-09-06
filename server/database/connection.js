import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

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