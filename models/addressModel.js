const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    addressLine: {
        type: String,
        required: true,
    },
    locality: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    pinCode: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    }

});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;