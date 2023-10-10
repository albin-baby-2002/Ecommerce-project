const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    age: {
        type: Number
    },
    gender: {
        type: String
    },
    joined_date: {
        type: Date,
        default: Date.now,
        immutable: true,

    },
    wishlist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WishList'
    },

    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'

    },

    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    addresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'

    }],
    token: {
        type: String,

    },
    blocked: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('User', userSchema)