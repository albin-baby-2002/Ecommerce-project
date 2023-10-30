const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,

    },
    description: {
        type: String,

    },
    blocked: {
        type: Boolean,
        default: false
    },
    onDiscount: {
        type: Boolean,
        default: false
    },
    discountName: {
        type: String,
        default: 'Category Discount'
    },
    discountAmount: {
        type: Number,
        default: 0,
    }

});

module.exports = mongoose.model('Category', categorySchema)