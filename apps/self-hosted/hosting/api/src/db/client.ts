/**
 * Database Client
 */

import pg from 'pg';

const { Pool } = pg;

// Create connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Database error:', err);
});

// Helper for single queries
export const db = {
  query: <T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> => {
    return pool.query(text, params);
  },
  
  // Get single row or null
  queryOne: async <T = any>(text: string, params?: any[]): Promise<T | null> => {
    const result = await pool.query<T>(text, params);
    return result.rows[0] || null;
  },
  
  // Get all rows
  queryAll: async <T = any>(text: string, params?: any[]): Promise<T[]> => {
    const result = await pool.query<T>(text, params);
    return result.rows;
  },
  
  // Transaction helper
  transaction: async <T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
};

export default db;
