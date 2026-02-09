const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('../lib/db');
const User = require('../models/User');

module.exports = async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ msg: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { username, password } = req.body || {};

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ msg: 'Please provide username and password' });
        }

        // Check if user exists
        let user = await User.findOne({ username: username.toLowerCase().trim() });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new user
        user = new User({
            username: username.toLowerCase().trim(),
            password: password
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Return JWT
        const payload = { user: { id: user.id } };
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        return res.status(201).json({ token });
    } catch (err) {
        console.error('Register Error:', err);
        return res.status(500).json({ msg: 'Server error' });
    }
};
