const express = require('express');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;

// Security + logging + limits
app.use(helmet());
app.use(morgan('tiny'));
app.use(cors()); // configure origin in production if needed
app.use(express.json({ limit: '10kb' }));

// Basic rate limiter for API endpoints
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

// Helper to append data to file (JSON array) using atomic write. Throws on failure.
async function appendToJsonFile(filePath, obj) {
  let arr = [];
  try {
    const content = await fsPromises.readFile(filePath, 'utf8');
    try { arr = JSON.parse(content || '[]'); } catch (e) { arr = []; }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // real error
    arr = [];
  }

  arr.push(obj);
  const tmp = filePath + '.tmp';
  await fsPromises.writeFile(tmp, JSON.stringify(arr, null, 2), { encoding: 'utf8' });
  await fsPromises.rename(tmp, filePath);
}

// POST /api/donate
app.post('/api/donate', async (req, res) => {
  const { name, email, amount } = req.body || {};
  if (!name || !email || !amount) {
    return res.status(400).json({ ok: false, message: 'Missing fields' });
  }
  // basic email & amount validation
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) return res.status(400).json({ ok: false, message: 'Invalid email' });
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) return res.status(400).json({ ok: false, message: 'Invalid amount' });
  if (String(name).length > 200) return res.status(400).json({ ok: false, message: 'Name too long' });

  const record = { name: String(name).trim(), email: String(email).trim(), amount: amt, date: new Date().toISOString() };
  try {
    await appendToJsonFile(path.join(__dirname, 'donations.json'), record);
    console.log('Received donation:', record);
    return res.json({ ok: true, message: 'Donation recorded' });
  } catch (err) {
    console.error('Failed to save donation', err);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, message: 'Missing fields' });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) return res.status(400).json({ ok: false, message: 'Invalid email' });
  if (String(message).length > 5000) return res.status(400).json({ ok: false, message: 'Message too long' });

  const record = { name: String(name).trim(), email: String(email).trim(), message: String(message).trim(), date: new Date().toISOString() };
  try {
    await appendToJsonFile(path.join(__dirname, 'messages.json'), record);
    console.log('Received contact message:', record);
    return res.json({ ok: true, message: 'Message received' });
  } catch (err) {
    console.error('Failed to save contact message', err);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

// Fallback for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, message: 'API endpoint not found' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
