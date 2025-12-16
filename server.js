require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Data = require('./models/Data');
const User = require('./models/User');
const auth = require('./middleware/auth');

const compression = require('compression');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const app = express();
const PORT = process.env.PORT || 5001; // Env Port (Koyeb) or 5001 (Local)

// --- SECURITY MIDDLEWARE ---
// --- DEBUG LOGGING ---
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// --- SECURITY MIDDLEWARE ---
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false // Allow cross-origin resource sharing
}));
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(xss()); // Prevent XSS

// --- CONFIGURATION ---
app.set('trust proxy', 1); // Trust first proxy (Required for Koyeb/Render/Heroku)

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(compression()); // Compress all responses
app.use(cors()); // Note: ideally restrict origin in production
app.use(express.json({ limit: '10mb' })); // Increased limit to prevent 413 errors on sync
// Static middleware moved to bottom

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cashbook', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- AUTH ROUTES ---

// POST: Register
app.post('/api/register', async (req, res) => {
    console.log('Register Request Body:', req.body);
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (user) {
            console.log('User already exists:', username);
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ username, password });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Return JWT
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// POST: Login
app.post('/api/login', async (req, res) => {
    console.log('Login Request Body:', req.body);
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch for:', username);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Return JWT
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- PROTECTED ROUTES ---

// --- API ROUTES ---

// GET: Fetch user data
app.get('/api/data', auth, async (req, res) => {
    try {
        let data = await Data.findOne({ userId: req.user.id });
        if (!data) {
            // Create default data for new user
            data = new Data({ userId: req.user.id });
            await data.save();
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Sync data (Save)
app.post('/api/sync', auth, async (req, res) => {
    try {
        const { books, businesses, categories, categoryBudgets, currentBusiness, profile } = req.body;

        // Upsert: Update if exists, create if not
        await Data.findOneAndUpdate(
            { userId: req.user.id },
            { books, businesses, categories, categoryBudgets, currentBusiness, profile },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'Data synced successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- STATIC FILES & FALLBACK ---
app.use(express.static(path.join(__dirname, '.'))); // Serve frontend files

// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const fs = require('fs');
server.on('error', (err) => {
    console.error('Server failed to start:', err);
    fs.writeFileSync('server_startup_error.txt', err.toString());
});

process.on('uncaughtException', (err) => {
    fs.writeFileSync('server_crash_error.txt', err.toString());
    process.exit(1);
});
