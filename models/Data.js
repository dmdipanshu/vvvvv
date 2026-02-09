const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    books: {
        type: Array,
        default: []
    },
    businesses: {
        type: Array,
        default: ['October', 'September', 'Personal']
    },
    categories: {
        type: Array,
        default: ['Food', 'Travel', 'Shopping', 'Bills', 'Others']
    },
    categoryBudgets: {
        type: Object,
        default: {}
    },
    currentBusiness: {
        type: String,
        default: 'October'
    },
    profile: {
        name: { type: String, default: 'Guest User' },
        mobile: { type: String, default: '' },
        email: { type: String, default: '' }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent model recompilation in serverless
module.exports = mongoose.models.Data || mongoose.model('Data', DataSchema);
