require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function debug() {
  await client.connect();
  try {
    const res = await client.query(`
      SELECT s.id, u.name, s.status, s.started_at 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.status = 'in_progress' 
      AND u.role = 'candidate'
    `);
    console.log('--- Active Candidate Sessions ---');
    console.table(res.rows);
    console.log('Total Count:', res.rowCount);
    
    const uniqueUsers = await client.query(`
      SELECT COUNT(DISTINCT user_id) as active_candidates
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'in_progress'
      AND u.role = 'candidate'
    `);
    console.log('Unique Active Candidates:', uniqueUsers.rows[0].active_candidates);
  } catch (err) {
    console.error('Debug failed:', err);
  } finally {
    await client.end();
  }
}

debug();
