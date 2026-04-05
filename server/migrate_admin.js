require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  await client.connect();
  try {
    console.log('Starting migration...');
    
    // 1. Add role column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'candidate';
    `);
    console.log('Role column verified/added.');

    // 2. Hash password
    const hash = bcrypt.hashSync('admin123', 10);
    
    // 3. Upsert admin
    await client.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('admin@daisy.com', $1, 'HR Admin', 'admin')
      ON CONFLICT (email) DO UPDATE SET role = 'admin';
    `, [hash]);
    
    console.log('Admin account (admin@daisy.com / admin123) verified/added.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
