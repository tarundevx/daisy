require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  await client.connect();
  try {
    // 1. Add access_code column
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS access_code TEXT DEFAULT 'DAISY-123';
    `);
    
    // 2. Generate unique codes for existing users (simplistic)
    await client.query(`
      UPDATE users SET access_code = 'DAISY-' || id::text WHERE access_code = 'DAISY-123';
    `);

    console.log('Migration SUCCESS: access_code column added and populated.');
  } catch (err) {
    console.error('Migration FAILED:', err);
  } finally {
    await client.end();
  }
}

migrate();
