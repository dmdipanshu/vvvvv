const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        default: 'guest'
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

module.exports = mongoose.model('Data', DataSchema);
