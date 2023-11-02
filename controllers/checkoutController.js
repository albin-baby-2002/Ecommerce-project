// ! importing necessary libraries and files

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const OtpData = require('../models/otpDataModel');
const Address = require('../models/addressModel');

const Cart = require('../models/cartModel')
const Coupon = require('../models/couponModel');
const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const CartItem = require('../models/cartItemModel');
const Product = require('../models/productModel');
const userVerificationHelper = require('../helpers/userVerificationHelpers');



// ! render checkout page 

const renderCheckOutPage = async (req, res, next) => {

    try {

        if (!req.session.userID) {

            req.session.message = {
                type: 'danger',
                message: 'Login to view your Checkout Page'
            }
            return res.redirect('/');


        };

        const userID = new mongoose.Types.ObjectId(req.session.userID);

        const Addresses = await User.aggregate([
            {
                $match: {
                    _id: userID
                }
            },
            {
                $lookup: {

                    from: "addresses",
                    localField: 'addresses',
                    foreignField: '_id',
                    as: 'Addresses'
                }
            }, {
                $unwind: '$Addresses'
            }, {
                $replaceRoot: {
                    newRoot: '$Addresses'
                }
            }

        ]).exec()



        if (!Addresses) {

            req.session.message = {
                type: 'danger',
                message: 'Login to view your wishlist'
            }


            return res.redirect('/user/cart');



        }

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
            }, {

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






        return res.render('users/checkout.ejs', { Addresses, itemsInCart, totalPriceOfCart });



    }
    catch (err) {
        next(err);
    }


}

// ! coupon verification handler 

const couponVerificationHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            return res.status(401).json({ "success": false, "message": "Your session timedOut login to access checkout features" })


        }

        let { couponCode } = req.body;

        couponCode = couponCode.trim().toLowerCase();

        const couponData = await Coupon.findOne({ code: couponCode });


        if (!couponData) {



            return res.status(400).json({ "success": false, "message": "It was an invalid coupon code !" });



        };


        const currentDate = new Date();

        const expirationDate = new Date(couponData.expirationDate);


        if (currentDate > expirationDate || !couponData.isActive) {
            return res.status(200).json({ "success": false, "message": " The coupon has expired or is inactive !" });


        }

        return res.status(200).json({ "success": true, "message": " It is a valid Coupon !" });



    }
    catch (err) {

        return res.status(500).json({ "success": false, "message": "Failed to verify coupon server facing some issues !" })

    }
}

// ! address selection and coupon applying of order

const addressCouponAndItemsInputHandler = async (req, res, next) => {


    try {


        if (!req.session.userID) {

            return res.status(401).json({ "success": false, "message": "Your session timedOut login to access checkout page" })


        }

        const userID = new mongoose.Types.ObjectId(req.session.userID);

        let { deliveryAddressID, couponCodeApplied, paymentMethod } = req.body;

        paymentMethod = paymentMethod.trim();

        let paymentStatus = paymentMethod === 'cod' ? 'cod' : 'pending';

        couponCodeApplied = couponCodeApplied.toLowerCase().trim();


        let rateOfCouponDiscount = null;

        let maximumCouponDiscount = null;

        let couponID = null

        if (couponCodeApplied !== '') {

            const couponData = await Coupon.findOne({ code: couponCodeApplied });


            if (couponData instanceof Coupon) {

                const currentDate = new Date();

                const expiryDate = new Date(couponData.expirationDate);

                if (couponData.isActive && (currentDate < expiryDate)) {

                    rateOfCouponDiscount = couponData.rateOfDiscount;
                    maximumCouponDiscount = couponData.maximumDiscount;
                    couponID = couponData._id;
                }

            }

        }





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
            }, {

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



        ]).exec();

        const categoryOffers = await Cart.aggregate([{
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

                        { category: { $arrayElemAt: ["$cartProductData.category", 0] } }
                    ]
                }
            }
        }
            , {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            }
        },
        {
            $project: {

                category: { $arrayElemAt: ['$category', 0] }
            }
        }, {
            $replaceRoot: {
                newRoot: '$category'
            }
        }, {
            $match: {
                onDiscount: true
            }
        }, {
            $project: {
                discountName: 1,
                discountAmount: 1
            }
        }

        ]);



        let categoryDiscount = 0;

        if (categoryOffers.length > 0) {

            categoryOffers.forEach((offer) => {
                categoryDiscount += offer.discountAmount;
            })


        }




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
                }, {

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



            ]).exec();




            totalPriceOfCart = totalPriceOfCart[0].totalAmount;

            let finalPrice = totalPriceOfCart;

            let couponDiscountAmount = 0;



            if (rateOfCouponDiscount && maximumCouponDiscount && couponID) {

                let discountAsPerRateOfDiscount = (totalPriceOfCart * rateOfCouponDiscount) / 100;

                couponDiscountAmount = discountAsPerRateOfDiscount > maximumCouponDiscount ? maximumCouponDiscount : discountAsPerRateOfDiscount;

                couponDiscountAmount = Math.ceil(couponDiscountAmount);

                finalPrice = totalPriceOfCart - couponDiscountAmount;

                if (!(totalPriceOfCart === (finalPrice + couponDiscountAmount))) {
                    throw new Error(' failed to calculate the discount . Issues in business logic')
                }

            }


            if (categoryDiscount > 0) {

                finalPrice -= categoryDiscount;

                if (!(totalPriceOfCart === (finalPrice + couponDiscountAmount + categoryDiscount))) {
                    throw new Error(' failed to calculate the discount . Issues in business logic')
                }


            }



            let newOrder;


            if (couponID) {
                newOrder = new Order({ userID, paymentMethod, paymentStatus, orderStatus: 'clientSideProcessing', shippingAddress: deliveryAddressID, grossTotal: totalPriceOfCart, couponApplied: couponID, discountAmount: couponDiscountAmount, finalPrice, categoryDiscount })
            } else {
                newOrder = new Order({ userID, paymentMethod, paymentStatus, orderStatus: 'clientSideProcessing', shippingAddress: deliveryAddressID, grossTotal: totalPriceOfCart, discountAmount: couponDiscountAmount, finalPrice, categoryDiscount });
            }


            if (newOrder) {

                let OrderItems = [];


                for (let i = 0; i < itemsInCart.length; i++) {



                    const newOrderItem = new OrderItem({
                        userID, product: itemsInCart[i].product, quantity: itemsInCart[i].quantity, totalPrice: itemsInCart[i].totalPriceOfTheProduct
                    })

                    const savedOrderItem = await newOrderItem.save();

                    if (savedOrderItem) {


                        OrderItems.push(savedOrderItem._id);
                    }

                }




                if (OrderItems.length > 0) {

                    newOrder.orderItems = OrderItems;

                    const savedNewOrder = await newOrder.save();

                    if (savedNewOrder instanceof Order) {





                        let orderID = savedNewOrder._id

                        let url = `/user/paymentPage/${orderID}`;

                        return res.status(201).json({ "success": true, "message": "created new order ", "url": url })



                    } else {

                        throw new Error('Failed to save the new order')
                    }



                } else {


                    throw new Error('Failed to create new OrderItems for the new Order');
                }





            } else {

                throw new Error('Failed to create new order document');

            }


        }







    }
    catch (err) {


        return res.status(500).json({ "success": false, "message": "Failed to process address and coupon server facing some issues !" })

    }
}

// ! render payment page 

const renderPaymentPage = async (req, res, next) => {

    try {

        if (!req.session.userID) {


            req.session.message = {
                type: 'danger',
                message: 'session time out login to got to payment page  !',

            };

            return res.redirect('/');


        }

        const userID = new mongoose.Types.ObjectId(req.session.userID);


        const orderID = new mongoose.Types.ObjectId(req.params.orderID);

        if (!orderID) {

            req.session.message = {
                type: 'danger',
                message: 'Failed to process the order try again  !',

            };

            return res.redirect('/user/checkout');


        }



        const orderData = await Order.findById(orderID);

        if (orderData.orderStatus !== 'clientSideProcessing' || orderData.clientOrderProcessingCompleted === true) {


            req.session.message = {
                type: 'danger',
                message: 'That order is already placed !',

            };

            return res.redirect('/user/checkout');



        }

        let productsData = await Order.aggregate([{
            $match: {
                _id: orderID
            }
        }, {
            $lookup: {
                from: 'orderitems',
                localField: 'orderItems',
                foreignField: '_id',
                as: 'orderedProducts',
            }
        }, {
            $unwind: "$orderedProducts"
        }, {
            $replaceRoot: {
                newRoot: "$orderedProducts"
            }
        }, {
            $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'productInfo'

            }
        }, {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        { _id: "$_id", userID: "$userID", product: "$product", quantity: "$quantity", totalPrice: "$totalPrice", __v: "$__v" },
                        { productInfo: { $arrayElemAt: ["$productInfo", 0] } }
                    ]
                }
            }
        }

        ]).exec();




        let address = await Order.aggregate([{
            $match: {
                _id: orderID
            }
        }, {
            $lookup: {
                from: 'addresses',
                localField: 'shippingAddress',
                foreignField: '_id',
                as: 'address',
            }
        }, {

            $unwind: "$address"
        }, {

            $replaceRoot: {
                newRoot: "$address"
            }
        }

        ]).exec();


        address = address[0];




        const categoryOffers = await Cart.aggregate([{
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

                        { category: { $arrayElemAt: ["$cartProductData.category", 0] } }
                    ]
                }
            }
        }
            , {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            }
        },
        {
            $project: {

                category: { $arrayElemAt: ['$category', 0] }
            }
        }, {
            $replaceRoot: {
                newRoot: '$category'
            }
        }, {
            $match: {
                onDiscount: true
            }
        }, {
            $project: {
                discountName: 1,
                discountAmount: 1
            }
        }

        ]);


        if (orderData && productsData && address && categoryOffers) {





            return res.render('users/paymentPage.ejs', { address, orderData, productsData, categoryOffers });




        } else {

            req.session.message = {
                type: 'danger',
                message: 'Failed to process the order try again  !',

            };

            return res.redirect('/user/checkout');




        }







    }
    catch (err) {

        next(err);
    }
}

// ! place cod order 

const placeCodOrderHandler = async (req, res, next) => {

    try {

        if (!req.session.userID) {

            return res.status(401).json({ "success": false, "message": "Your session timedOut login to place order" })


        }


        const userID = req.session.userID;

        const orderID = new mongoose.Types.ObjectId(req.body.orderID);

        const orderPlaced = await Order.updateOne({ _id: orderID, userID: userID }, { $set: { orderStatus: 'shipmentProcessing', clientOrderProcessingCompleted: true } });

        let orderedItems = await Order.aggregate([{
            $match: {
                _id: orderID,
            }
        }

            , {
            $project: {
                'orderItems': 1
            }

        }, {
            $lookup: {
                from: 'orderitems',
                localField: 'orderItems',
                foreignField: '_id',
                as: 'items'
            }
        }, {
            $unwind: '$items'
        }, {
            $replaceRoot: {
                newRoot: '$items'
            }
        }, {
            $project: {

                product: 1,
                quantity: 1
            }
        }, {
            $project: {
                _id: 0
            }
        }
        ]).exec();






        if (orderPlaced.matchedCount === 1 && orderPlaced.modifiedCount === 1) {




            const userDataUpdate = await User.findByIdAndUpdate(userID, { $push: { orders: orderID } })

            const userCart = await Cart.findOne({ userID: userID });

            const itemsInCart = userCart.items;


            for (const item of orderedItems) {

                const updateProductQuantity = await Product.findByIdAndUpdate(item.product, { $inc: { stock: -(item.quantity) } })

            }

            const deletedCartItems = await CartItem.deleteMany({ _id: { $in: itemsInCart } });

            if (deletedCartItems.ok && deletedCartItems.n === itemsInCart.length && deletedCartItems.deletedCount === itemsInCart.length) {

                const updatedCart = await Cart.findByIdAndUpdate(userCart._id, { $set: { items: [] } });

                if (updatedCart instanceof Cart) {
                }

            }




            return res.status(201).json({ "success": true, "message": " New Order placed successfully  !" })
                ;


        } else {

            return res.status(500).json({ "success": false, "message": "Failed to place order server facing issues try Again !" })

        }



    }

    catch (err) {


        return res.status(500).json({ "success": false, "message": "Failed to place order server facing issues try Again !" })


    }
}


// ! add new delivery address handler

const addNewDeliveryAddress = async (req, res, next) => {

    try {


        if (!req.session.userID) {

            return res.status(401).json({ "success": false, "message": "Your session timedOut login to add New Address" })


        }

        const userID = req.session.userID;

        let { fullName, country, phone, locality, city, addressLine, state, pinCode } = req.body;


        if (!fullName || !country || !phone || !locality || !city || !addressLine || !state || !pinCode) {

            return res.status(400).json({ "success": false, "message": " Failed to create new Address all fields are mandatory  !" })
        }

        const newAddress = new Address({ userID, fullName, country, phone, locality, city, addressLine, state, pinCode });

        savedAddress = await newAddress.save();

        if (savedAddress instanceof Address) {

            const updatedUser = await User.findByIdAndUpdate(userID, { $push: { addresses: savedAddress._id } });

            if (updatedUser instanceof User) {

                return res.status(201).json({ "success": true, "message": " New Delivery Address Added successfully" })
            }
            else {

                return res.status(500).json({ "success": false, "message": " Failed to create new Address . Server facing issues!" })
            }

        }
        else {

            return res.status(500).json({ "success": false, "message": " Failed to create new Address . Server facing issues!" })

        }




    }
    catch (err) {
        next(err);
    }


}






module.exports = {

    renderCheckOutPage,
    couponVerificationHandler,
    addressCouponAndItemsInputHandler,
    renderPaymentPage,
    placeCodOrderHandler,
    addNewDeliveryAddress
};