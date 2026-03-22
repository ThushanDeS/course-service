const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongodb.uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`); // eslint-disable-line no-console
        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`); // eslint-disable-line no-console
        process.exit(1);
    }
};

module.exports = connectDB;
