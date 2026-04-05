require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function cleanup() {
  await client.connect();
  try {
    const res = await client.query(`
      UPDATE sessions SET status = 'abandoned', ended_at = NOW()
      WHERE status = 'in_progress'
    `);
    console.log(`CLEANED: ${res.rowCount} stale sessions marked as abandoned.`);
  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await client.end();
  }
}

cleanup();
