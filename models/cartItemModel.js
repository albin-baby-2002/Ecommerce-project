const mongoose = require('mongoose');


const cartItemSchema = new mongoose.Schema({
    cartID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart', // Reference to the Product model
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1, // Default quantity is 1
    },
    price: {
        type: Number,
        required: true,
    }
});

module.exports = mongoose.model('CartItem', cartItemSchema);
