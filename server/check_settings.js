require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  await client.connect();
  try {
    const res = await client.query("SELECT * FROM system_settings");
    console.log('--- SYSTEM SETTINGS ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await client.end();
  }
}

check();
