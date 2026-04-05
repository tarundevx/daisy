const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'daisy-default-secret';

// Basic Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Basic Signup (for testing)
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, name: user.name, role: user.role || 'candidate' }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { ...user, role: user.role || 'candidate' } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error or User already exists' });
  }
});

// Auth Middleware (to use in other routes)
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

router.get('/profile', auth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { router, auth };
