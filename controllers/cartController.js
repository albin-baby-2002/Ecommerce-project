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

            res.status(401).json({ "success": false, "message": "login to add product to cart" })

            return;
        }


        let { productID, quantity } = req.body;

        quantity = Number(quantity);

        if (!productID || !quantity || isNaN(quantity) || quantity <= 0) {

            res.status(400).json({ "success": false, "message": "All fields not received and quantity should be a value greater than 0 . Try Again" });

            return;
        }


        let productData = await Product.findById(productID);
        let stock = productData.stock;


        if (stock === 0) {

            res.status(400).json({ "success": false, "message": " Product Out Of Stock" });

            return;

        } else if (stock < quantity) {


            res.status(400).json({ "success": false, "message": `only ${stock} units left in stock.` });

            return;
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

                res.status(400).json({ "success": false, "message": " Server facing some issues relating to cart creation Try Again" });

                return;

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


                res.status(400).json({ "success": false, "message": `only ${stock} units left in stock and you already have ${existingQuantityInCart} of this in your cart ` });

                return;
            }



            const QuantityIncrease = await CartItem.updateOne({ _id: ProductAlreadyInCart._id }, { $inc: { quantity: quantity } });

            if (!QuantityIncrease) {
                res.status(500).json({ "success": false, "message": " Server facing some issues relating to cart creation Try Again" });

                return;
            }

            res.status(400).json({ "success": true, "message": " Item added successfully to cart" });

            return;


        }

        const cartItem = new CartItem({ cartID: userCartID, product: productID, quantity, price: productData.price });

        await cartItem.save();


        const updatedCart = await Cart.findByIdAndUpdate(userCartID, { $push: { items: cartItem._id } })


        if (!updatedCart) {
            res.status(400).json({ "success": false, "message": " Server facing some issues relating to cart updating Try Again" });

            return;
        }


        res.status(400).json({ "success": true, "message": " Item added successfully to cart" });

        return;


    }


    catch (err) {

        console.log(err);

        res.status(500).json({ "success": false, "message": "failed try again Hint: server facing issues !" })

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
            res.redirect('/');

            return;
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

                    $addFields: {
                        totalPriceOfTheProduct: {
                            $multiply: ["$quantity", "$price"]
                        }
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



        res.render('users/shoppingCart.ejs', { itemsInCart, grandTotal: totalPriceOfCart });

        return;

    }
    catch (err) {
        next(err);
    }


}

// ! delete cartItem from user cart

const deleteItemFromCartHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            res.status(401).json({
                "success": false,
                "message": "session timedOut login to remove item from cart"
            })

            return;
        }

        const { cartItemID } = req.body;

        const userID = req.session.userID;

        if (!cartItemID || !userID) {

            res.status(400).json({
                "success": false,
                "message": "server facing issues try again Hint failed to get cartItem data !"
            })

            return;
        };

        const cartItem = await CartItem.findById(cartItemID);

        console.log('\n\n\n' + cartItem);

        if (!cartItem) {

            res.status(400).json({
                "success": false,
                "message": " Failed to deleted as item not found in cart !"
            });
            return;
        };

        const CartId = cartItem.cartID;

        // this process removes the cartItem form list of items in cart but the cart item will not be deleted

        const removedCartItemID = await Cart.findByIdAndUpdate(CartId, { $pull: { items: cartItemID } })


        console.log('\n\n\n' + removedCartItemID);

        if (!removedCartItemID) {

            res.status(500).json({
                "success": false,
                "message": " server facing some issues try again !"
            });

            return;

        }

        const deletedCartItem = await CartItem.findByIdAndDelete(cartItemID);

        if (deletedCartItem) {

            res.status(200).json({
                "success": true,
                "message": " Item Removed from cart"
            });

            return;
        }

        res.status(500).json({
            "success": false,
            "message": " server facing some issues try again !"
        });

        return;


    }
    catch (err) {

        console.log(err)

        res.status(500).json({
            "success": false,
            "message": "server facing issues  try again"
        })
    }


}

// ! reduce quantity of item in cart 


const reduceCartItemQuantityHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            res.status(401).json({
                "success": false,
                "message": "session timedOut login to reduce item quantity from cart"
            })

            return;
        }

        const { cartItemID } = req.body;

        const userID = req.session.userID;

        if (!cartItemID || !userID) {

            res.status(400).json({
                "success": false,
                "message": "server facing issues try again Hint failed to get cartItem data !"
            })

            return;
        };

        const cartItem = await CartItem.findById(cartItemID);

        console.log('\n\n\n' + cartItem);

        if (!cartItem) {

            res.status(400).json({
                "success": false,
                "message": " Failed to reduce quantity as item not found in cart !"
            });
            return;
        };


        if (cartItem.quantity === 1) {

            res.status(400).json({
                "success": false,
                "message": " There is only one more quantity in cart. If you wish to remove it press delete button !"
            });

            return;

        }

        const updatedCartItem = await CartItem.findByIdAndUpdate(cartItemID, { $inc: { quantity: -1 } });

        if (updatedCartItem) {

            res.status(200).json({
                "success": true,
                "message": " removed one item!"
            });

        }


    }
    catch (err) {

        console.log(err)

        res.status(500).json({
            "success": false,
            "message": "server facing issues  try again"
        })
    }


}

// ! get total of cart 


const getTotalCartPrice = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            res.status(401).json({ "success": false, "message": " your session timeout login to get data !" })

            return;
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

                $addFields: {
                    totalPriceOfTheProduct: {
                        $multiply: ["$quantity", "$price"]
                    }
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

        console.log(totalPriceOfCart);

        if (totalPriceOfCart) {
            res.status(200).json({ "success": true, "message": `${totalPriceOfCart}` });

            return;
        }

        else {

            res.status(500).json({ "success": false, "message": " failed to get data !" })

            return;

        }



    }
    catch (err) {


        res.status(500).json({ "success": false, "message": " failed to get data !" })
    }


}


module.exports = {
    addToCartHandler,
    renderCartPage,
    deleteItemFromCartHandler,
    reduceCartItemQuantityHandler,
    getTotalCartPrice
}