const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {

        type: String,
        required: true,
    },
    groupingID: {
        type: Number,
        required: true
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
    size: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
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
    }],
    onOffer: {
        type: Boolean,
        default: false
    },
    rateOfDiscount: {
        type: Number,
        default: 0
    },
    offerPrice: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Product', productSchema)