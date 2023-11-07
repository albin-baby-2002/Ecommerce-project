// ! importing necessary libraries and files

const mongoose = require('mongoose');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const CartItem = require('../models/cartItemModel');



// ! add product to cart handler

const addToCartHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            return res.status(401).json({ "success": false, "message": "login to add product to cart" })


        }


        let { productID, quantity } = req.body;

        quantity = Number(quantity);

        if (!productID || !quantity || isNaN(quantity) || quantity <= 0) {

            return res.status(400).json({ "success": false, "message": "All fields not received and quantity should be a value greater than 0 . Try Again" });


        }


        let productData = await Product.findById(productID);
        let stock = productData.stock;


        if (stock === 0) {

            return res.status(400).json({ "success": false, "message": " Product Out Of Stock" });



        } else if (stock < quantity) {


            return res.status(400).json({ "success": false, "message": `only ${stock} units left in stock.` });


        }


        const userID = new mongoose.Types.ObjectId(req.session.userID);
        const userData = await User.findById(userID);
        let userCartID = userData.cart;


        if (!userCartID) {

            const newCart = new Cart({ userID });
            await newCart.save();


            const updatedUser = await User.findByIdAndUpdate(userID, { $set: { cart: newCart._id } }, { new: true });
            userCartID = updatedUser.cart;


            if (!userCartID) {

                return res.status(400).json({ "success": false, "message": " Server facing some issues relating to cart creation Try Again" });



            }
        };



        let existingItemsInCart = await Cart.aggregate([
            {
                $match: {
                    userID: userID,
                },
            }, {
                $lookup: {
                    from: 'cartitems',
                    localField: 'items',
                    foreignField: '_id',
                    as: 'cartItems',
                }
            }


        ]).exec()



        existingItemsInCart = existingItemsInCart[0].cartItems;

        let ProductAlreadyInCart = existingItemsInCart.find((item) => {

            return item.product.equals(productID);
        })



        if (ProductAlreadyInCart) {

            const existingQuantityInCart = ProductAlreadyInCart.quantity;

            if ((existingQuantityInCart + quantity) > stock) {


                return res.status(400).json({ "success": false, "message": `only ${stock} units left in stock and you already have ${existingQuantityInCart} of this in your cart ` });


            }



            const QuantityIncrease = await CartItem.updateOne({ _id: ProductAlreadyInCart._id }, { $inc: { quantity: quantity } });

            if (!QuantityIncrease) {
                return res.status(500).json({ "success": false, "message": " Server facing some issues relating to cart creation Try Again" });


            }

            return res.status(400).json({ "success": true, "message": " Item added successfully to cart" });




        }

        const cartItem = new CartItem({ cartID: userCartID, product: productID, quantity, price: productData.price });

        await cartItem.save();


        const updatedCart = await Cart.findByIdAndUpdate(userCartID, { $push: { items: cartItem._id } })


        if (!updatedCart) {
            return res.status(400).json({ "success": false, "message": " Server facing some issues relating to cart updating Try Again" });


        }


        return res.status(400).json({ "success": true, "message": " Item added successfully to cart" });




    }


    catch (err) {


        return res.status(500).json({ "success": false, "message": "failed try again Hint: server facing issues !" })

    }


}

// ! render cart page 

const renderCartPage = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            req.session.message = {
                type: 'danger',
                message: 'Login to view your cart '
            }
            return res.redirect('/');


        }

        const userID = new mongoose.Types.ObjectId(req.session.userID);

        const userData = await User.findById(userID);



        let itemsInCart = await Cart.aggregate([
            {
                $match: {
                    userID: userID,
                },
            }, {
                $lookup: {
                    from: 'cartitems',
                    localField: 'items',
                    foreignField: '_id',
                    as: 'cartItems',
                }
            }, {

                $unwind: "$cartItems"


            }, {
                $replaceRoot: {
                    newRoot: '$cartItems'
                }
            }, {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'cartProductData'

                }
            }, {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            { _id: "$_id", cartID: "$cartID", product: "$product", quantity: "$quantity", price: "$price", __v: "$__v" },
                            { cartProductData: { $arrayElemAt: ["$cartProductData", 0] } }
                        ]
                    }
                }
            }



        ]).exec()

        let totalPriceOfCart;


        if (itemsInCart.length > 0) {


            totalPriceOfCart = await Cart.aggregate([
                {
                    $match: {
                        userID: userID,
                    },
                }, {
                    $lookup: {
                        from: 'cartitems',
                        localField: 'items',
                        foreignField: '_id',
                        as: 'cartItems',
                    }
                }, {

                    $unwind: "$cartItems"


                }, {
                    $replaceRoot: {
                        newRoot: '$cartItems'
                    }
                }, {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'cartProductData'

                    }
                }, {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                { _id: "$_id", cartID: "$cartID", product: "$product", quantity: "$quantity", price: "$price", __v: "$__v" },
                                { cartProductData: { $arrayElemAt: ["$cartProductData", 0] } }
                            ]
                        }
                    }
                },

                {

                    $addFields: {

                        totalPriceOfTheProduct: {
                            $cond: {
                                if: { $eq: ['$cartProductData.onOffer', true] },
                                then: { $multiply: ["$quantity", '$cartProductData.offerPrice'] },
                                else: { $multiply: ["$quantity", "$price"] },
                            },
                        },
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$totalPriceOfTheProduct" }
                    }
                }



            ]).exec()



            totalPriceOfCart = totalPriceOfCart[0].totalAmount;


        }
        else {
            totalPriceOfCart = 0
        }



        return res.render('users/shoppingCart.ejs', { itemsInCart, grandTotal: totalPriceOfCart });



    }
    catch (err) {
        next(err);
    }


}

// ! delete cartItem from user cart

const deleteItemFromCartHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            return res.status(401).json({
                "success": false,
                "message": "session timedOut login to remove item from cart"
            })


        }

        const { cartItemID } = req.body;

        const userID = req.session.userID;

        if (!cartItemID || !userID) {

            return res.status(400).json({
                "success": false,
                "message": "server facing issues try again Hint failed to get cartItem data !"
            })


        };

        const cartItem = await CartItem.findById(cartItemID);


        if (!cartItem) {

            return res.status(400).json({
                "success": false,
                "message": " Failed to deleted as item not found in cart !"
            });

        };

        const CartId = cartItem.cartID;

        // this process removes the cartItem form list of items in cart but the cart item will not be deleted

        const removedCartItemID = await Cart.findByIdAndUpdate(CartId, { $pull: { items: cartItemID } })



        if (!removedCartItemID) {

            return res.status(500).json({
                "success": false,
                "message": " server facing some issues try again !"
            });



        }

        const deletedCartItem = await CartItem.findByIdAndDelete(cartItemID);

        if (deletedCartItem) {

            return res.status(200).json({
                "success": true,
                "message": " Item Removed from cart"
            });


        }

        return res.status(500).json({
            "success": false,
            "message": " server facing some issues try again !"
        });




    }
    catch (err) {


        return res.status(500).json({
            "success": false,
            "message": "server facing issues  try again"
        })
    }


}

// ! reduce quantity of item in cart 


const reduceCartItemQuantityHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            return res.status(401).json({
                "success": false,
                "message": "session timedOut login to reduce item quantity from cart"
            })


        }

        const { cartItemID } = req.body;

        const userID = req.session.userID;

        if (!cartItemID || !userID) {

            return res.status(400).json({
                "success": false,
                "message": "server facing issues try again Hint failed to get cartItem data !"
            })


        };

        const cartItem = await CartItem.findById(cartItemID);


        if (!cartItem) {

            return res.status(400).json({
                "success": false,
                "message": " Failed to reduce quantity as item not found in cart !"
            });

        };


        if (cartItem.quantity === 1) {

            return res.status(400).json({
                "success": false,
                "message": " There is only one more quantity in cart. If you wish to remove it press delete button !"
            });



        }

        const updatedCartItem = await CartItem.findByIdAndUpdate(cartItemID, { $inc: { quantity: -1 } });

        if (updatedCartItem) {

            return res.status(200).json({
                "success": true,
                "message": " removed one item!"
            });

        }


    }
    catch (err) {


        return res.status(500).json({
            "success": false,
            "message": "server facing issues  try again"
        })
    }


}

// ! get total of cart 


const getTotalCartPrice = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            return res.status(401).json({ "success": false, "message": " your session timeout login to get data !" })


        }

        const userID = new mongoose.Types.ObjectId(req.session.userID);



        let totalPriceOfCart = await Cart.aggregate([
            {
                $match: {
                    userID: userID,
                },
            }, {
                $lookup: {
                    from: 'cartitems',
                    localField: 'items',
                    foreignField: '_id',
                    as: 'cartItems',
                }
            }, {

                $unwind: "$cartItems"


            }, {
                $replaceRoot: {
                    newRoot: '$cartItems'
                }
            }, {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'cartProductData'

                }
            }, {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            { _id: "$_id", cartID: "$cartID", product: "$product", quantity: "$quantity", price: "$price", __v: "$__v" },
                            { cartProductData: { $arrayElemAt: ["$cartProductData", 0] } }
                        ]
                    }
                }
            },

            {

                $addFields: {

                    totalPriceOfTheProduct: {
                        $cond: {
                            if: { $eq: ['$cartProductData.onOffer', true] },
                            then: { $multiply: ["$quantity", '$cartProductData.offerPrice'] },
                            else: { $multiply: ["$quantity", "$price"] },
                        },
                    },
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalPriceOfTheProduct" }
                }
            }



        ]).exec()

        totalPriceOfCart = totalPriceOfCart[0].totalAmount;


        if (totalPriceOfCart) {
            return res.status(200).json({ "success": true, "message": `${totalPriceOfCart}` });


        }

        else {

            return res.status(500).json({ "success": false, "message": " failed to get data !" })



        }



    }
    catch (err) {


        return res.status(500).json({ "success": false, "message": " failed to get data !" })
    }


}


module.exports = {
    addToCartHandler,
    renderCartPage,
    deleteItemFromCartHandler,
    reduceCartItemQuantityHandler,
    getTotalCartPrice
}