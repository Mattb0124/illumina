import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async <T extends QueryResultRow = any>(
  text: string, 
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    // Only log slow queries (>100ms) or in development
    if (duration > 100 || process.env.NODE_ENV === 'development') {
      console.log('Executed query', { duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Query error', { 
      duration, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};

// Get a client from the pool (for transactions)
const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

export {
  pool,
  query,
  getClient
};