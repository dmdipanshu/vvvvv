const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    // Check MONGO_URI at runtime, not at module load
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
        throw new Error('MONGO_URI environment variable is not defined');
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URI, {
            bufferCommands: false,
        }).then((mongoose) => {
            console.log('MongoDB Connected');
            return mongoose;
        }).catch((err) => {
            cached.promise = null;
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    return cached.conn;
}

module.exports = connectDB;
