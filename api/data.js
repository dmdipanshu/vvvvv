const connectDB = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const Data = require('../models/Data');

module.exports = async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ msg: 'Method not allowed' });
    }

    // Verify auth
    const authResult = verifyAuth(req);
    if (authResult.error) {
        return res.status(authResult.status).json({ msg: authResult.error });
    }

    try {
        await connectDB();

        let data = await Data.findOne({ userId: authResult.user.id });
        if (!data) {
            // Create default data for new user
            data = new Data({ userId: authResult.user.id });
            await data.save();
        }

        return res.status(200).json(data);
    } catch (err) {
        console.error('Data Fetch Error:', err);
        return res.status(500).json({ error: err.message });
    }
};
