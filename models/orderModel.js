const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    orderItems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OrderItem',

        },
    ],
    orderDate: {
        type: Date,
        default: Date.now,
    },

    paymentMethod: {
        type: String,
        enum: ['cod', 'onlinePayment'],

    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'cod', 'failed', 'refunded', 'cancelled'],
        required: true,
    },
    orderStatus: {
        type: String,
        enum: ['clientSideProcessing', 'shipmentProcessing', 'shipped', 'delivered', 'cancelled'],
        required: true,

    },
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    razorpayTransactionId: {
        type: String,
        ref: 'PrepaidPaymentDetail',
    },

    grossTotal: {
        type: Number,
        required: true,
    },

    couponApplied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    finalPrice: {
        type: Number,
        required: true,
    },
    clientOrderProcessingCompleted: {
        type: Boolean,
        default: false
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
