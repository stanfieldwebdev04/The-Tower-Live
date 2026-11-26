const express = require('express');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { Pool } = require('pg')


const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Helper to issue the 30-day HttpOnly cookie
function setAuthCookie(res, user) {
    const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '30d' }
);
    res.cookie('auth_token', token, {
        httpOnly: true, // Blocks client-side JS from reading the token (XSS protection)
        secure: true, // Requires HTTPS (provided automatically by your Cloudflare Tunnel)
        sameSite: 'lax', // Protects against CSRF while working on normal navigation
        maxAge: THIRTY_DAYS_MS,
    });

};


// 1. Register a new account
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password || username.length < 3 || password.length < 6) {
        return res.status(400).json({ error: 'Username (3+ chars) and password (6+ chars) required.'});

    try {
        // Hash password with 12 salt rounds
        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username.trim(), passwordHash]
        );

        const user = result.rows;
        setAuthCookie(res, user);
        res.status(201).json({ user });
} catch (err) {
  if (err.code === '23505') { // Postgres unique_violation code
    return res.status(409).json({ error: 'Username is already taken.' });
   }    
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error creating account. '});
   }
});


// 2. Log in to an existing account
app.post('/api/login', async (req, res) => {
    const {username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT id, username, password_hash FROM users WHERE username = $1',
            [username?.trim()]
        );
        const user = result.rows;

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid username or password'});
        }

        setAuthCookie(res, user);
        res.json({ user: { id: user.id, username: user.username } });
      } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error logging in.' });
      }
    });



// 3. Check if visitor already has a valid 30-day session
app.get('/api/me', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ authenticated: false });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ authenticated: true, user: { id: decoded.id, username: decoded.username } });
      } catch {
        res.status(401).json({ authenticated: false });
      }
    });

// 4. Middleware to protect any restricted API routes (like chat or stream tokens)
function requireAuth(req, res, next) {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: 'Account required.' });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
}

// Example protected route:
app.get('/api/chat/history', requireAuth, async (req, res) => {
    const messages = await pool.query(
        `SELECT c.id, u.username, c.message, c.created_at
         FROM chat_messages c JOIN users u ON c.user_id = u.id
         WHERE c.created_at > NOW() - INTERVAL '7 days'
         ORDER BY c.created_at ASC`
    );
    res.json(messages.rows);
});


app.get('/api/hello', (req, res) => {
  res.json({ message: 'Connected! Data received from Node.js container.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
