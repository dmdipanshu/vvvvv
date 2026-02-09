const connectDB = require('../lib/db');
const { verifyAuth } = require('../lib/auth');
const Data = require('../models/Data');

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

    // Verify auth
    const authResult = verifyAuth(req);
    if (authResult.error) {
        return res.status(authResult.status).json({ msg: authResult.error });
    }

    try {
        await connectDB();

        const body = req.body || {};
        const { books, businesses, categories, categoryBudgets, currentBusiness, profile } = body;

        // Upsert: Update if exists, create if not
        await Data.findOneAndUpdate(
            { userId: authResult.user.id },
            {
                books: books || [],
                businesses: businesses || [],
                categories: categories || [],
                categoryBudgets: categoryBudgets || {},
                currentBusiness: currentBusiness || '',
                profile: profile || {},
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({ success: true, message: 'Data synced successfully' });
    } catch (err) {
        console.error('Sync Error:', err);
        return res.status(500).json({ error: err.message });
    }
};
