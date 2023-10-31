const mongoose = require('mongoose');


const orderItemSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    },
    totalPrice: {
        type: Number,
        required: true,
    }
});

module.exports = mongoose.model('OrderItem', orderItemSchema);
