require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  await client.connect();
  try {
    // 1. Create system_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    
    // 2. Initialize common_access_code
    await client.query(`
      INSERT INTO system_settings (key, value)
      VALUES ('common_access_code', 'DAISY-2026')
      ON CONFLICT (key) DO NOTHING;
    `);

    console.log('Migration SUCCESS: system_settings table created and common_access_code initialized.');
  } catch (err) {
    console.error('Migration FAILED:', err);
  } finally {
    await client.end();
  }
}

migrate();
