const mongoose = require('mongoose');

const wishListSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]

})

module.exports = mongoose.model('WishList', wishListSchema)