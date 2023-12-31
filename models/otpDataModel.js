const mongoose = require('mongoose');

const otpDataSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    }
});

module.exports = mongoose.model('OtpData', otpDataSchema)