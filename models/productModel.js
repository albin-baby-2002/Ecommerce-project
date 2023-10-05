const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {

        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    images: [{
        type: String,
        required: true

    }],
    price: {
        type: Number,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },

    onSale: {
        type: Boolean,
        default: true
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }]
});

module.exports = mongoose.model('Product', productSchema)