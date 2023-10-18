const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },

    rateOfDiscount: {
        type: Number,
        required: true,
    },

    maximumDiscount: {
        type: Number,
        required: true,
    },

    isActive: {
        type: Boolean,
        default: true
    },
    expirationDate: {
        type: Date,
    },

});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
