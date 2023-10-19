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


const userVerificationHelper = require('../helpers/userVerificationHelpers');


const couponVerificationHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            res.status(401).json({ "success": false, "message": "Your session timedOut login to access checkout features" })

            return;
        }

        let { couponCode } = req.body;

        couponCode = couponCode.trim().toLowerCase();

        const couponData = await Coupon.findOne({ code: couponCode });

        console.log(couponData);

        if (!couponData) {



            res.status(400).json({ "success": false, "message": "It was an invalid coupon code !" });

            return;

        };


        const currentDate = new Date();

        const expirationDate = new Date(couponData.expirationDate);


        if (currentDate > expirationDate || !couponData.isActive) {
            res.status(200).json({ "success": false, "message": " The coupon has expired or is inactive !" });

            return;
        }

        res.status(200).json({ "success": true, "message": " It is a valid Coupon !" });



    }
    catch (err) {

        res.status(500).json({ "success": false, "message": "Failed to verify coupon server facing some issues !" })

    }
}


// ! address selection and coupon applying of order

const addressCouponAndItemsInputHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            res.status(401).json({ "success": false, "message": "Your session timedOut login to access checkout page" })

            return;
        }

        const userID = new mongoose.Types.ObjectId(req.session.userID);

        let { deliveryAddressID, couponCodeApplied, paymentMethod } = req.body;

        paymentMethod = paymentMethod.trim();

        let paymentStatus = paymentMethod === 'cod' ? 'cod' : 'pending';

        couponCodeApplied = couponCodeApplied.toLowerCase().trim();

        console.log(req.body);

        let rateOfDiscount = null;

        let maximumDiscount = null;

        let couponID = null

        if (couponCodeApplied !== '') {

            const couponData = await Coupon.findOne({ code: couponCodeApplied });


            if (couponData instanceof Coupon) {

                const currentDate = new Date();

                const expiryDate = new Date(couponData.expirationDate);

                if (couponData.isActive && (currentDate < expiryDate)) {

                    rateOfDiscount = couponData.rateOfDiscount;
                    maximumDiscount = couponData.maximumDiscount;
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
                        $multiply: ["$quantity", "$price"]
                    }
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

            let finalPrice = totalPriceOfCart;

            let discountAmount = 0;

            if (rateOfDiscount && maximumDiscount && couponID) {

                let discountAsPerRateOfDiscount = (totalPriceOfCart * rateOfDiscount) / 100;

                discountAmount = discountAsPerRateOfDiscount > maximumDiscount ? maximumDiscount : discountAsPerRateOfDiscount;

                finalPrice = totalPriceOfCart - discountAmount;

                if (!(totalPriceOfCart === (finalPrice + discountAmount))) {
                    throw new Error(' failed to calculate the discount . Issues in business logic')
                }

            }

            let newOrder;


            if (couponID) {
                newOrder = new Order({ userID, paymentMethod, paymentStatus, orderStatus: 'clientSideProcessing', shippingAddress: deliveryAddressID, grossTotal: totalPriceOfCart, couponApplied: couponID, discountAmount, finalPrice })
            } else {
                newOrder = new Order({ userID, paymentMethod, paymentStatus, orderStatus: 'clientSideProcessing', shippingAddress: deliveryAddressID, grossTotal: totalPriceOfCart, discountAmount, finalPrice })
            }


            if (newOrder) {

                let OrderItems = [];


                for (let i = 0; i < itemsInCart.length; i++) {



                    const newOrderItem = new OrderItem({
                        userID, product: itemsInCart[i].product, quantity: itemsInCart[i].quantity, totalPrice: itemsInCart[i].totalPriceOfTheProduct
                    })

                    const savedOrderItem = await newOrderItem.save();

                    if (savedOrderItem) {

                        console.log(savedOrderItem + " jjj \n \n \n");

                        OrderItems.push(savedOrderItem._id);
                    }

                }




                if (OrderItems.length > 0) {

                    newOrder.orderItems = OrderItems;

                    const savedNewOrder = await newOrder.save();

                    if (savedNewOrder instanceof Order) {



                        console.log('successfully');


                        let orderID = savedNewOrder._id

                        let url = `/user/paymentPage/${orderID}`;

                        res.status(201).json({ "success": true, "message": "created new order ", "url": url })



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

        console.log(err);

        res.status(500).json({ "success": false, "message": "Failed to process address and coupon server facing some issues !" })

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

            res.redirect('/');

            return;
        }


        const orderID = new mongoose.Types.ObjectId(req.params.orderID);

        if (!orderID) {

            req.session.message = {
                type: 'danger',
                message: 'Failed to process the order try again  !',

            };

            res.redirect('/user/checkout');

            return;
        }



        const orderData = await Order.findById(orderID);

        if (orderData.orderStatus !== 'clientSideProcessing' || orderData.clientOrderProcessingCompleted === true) {


            req.session.message = {
                type: 'danger',
                message: 'That order is already placed !',

            };

            res.redirect('/user/checkout');

            return;

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


        // console.log('\n\n\n' + JSON.stringify(productsData, null, 2) + '\n\n\n');


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

        console.log('\n\n\n' + JSON.stringify(address, null, 2) + '\n\n\n');


        if (orderData && productsData && address) {





            res.render('users/paymentPage.ejs', { address, orderData, productsData });




        } else {

            req.session.message = {
                type: 'danger',
                message: 'Failed to process the order try again  !',

            };

            res.redirect('/user/checkout');

            return;


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

            res.status(401).json({ "success": false, "message": "Your session timedOut login to place order" })

            return;
        }

        console.log(req.body);

        const userID = req.session.userID;

        const { orderID } = req.body;

        const orderPlaced = await Order.updateOne({ _id: orderID, userID: userID }, { $set: { orderStatus: 'shipmentProcessing', clientOrderProcessingCompleted: true } })

        console.log(orderPlaced)

        if (orderPlaced.matchedCount === 1 && orderPlaced.modifiedCount === 1) {

            const userDataUpdate = await User.findByIdAndUpdate(userID, { $push: { orders: orderID } })

            const userCart = await Cart.findOne({ userID: userID });

            const itemsInCart = userCart.items;

            console.log(itemsInCart);

            const deletedCartItems = await CartItem.deleteMany({ _id: { $in: itemsInCart } });

            if (deletedCartItems.ok && deletedCartItems.n === itemsInCart.length && deletedCartItems.deletedCount === itemsInCart.length) {

                const updatedCart = await Cart.findByIdAndUpdate(userCart._id, { $set: { items: [] } });

                if (updatedCart instanceof Cart) {
                    console.log('successfully removed from the cart');
                }

            }




            res.status(201).json({ "success": true, "message": " New Order placed successfully  !" })
                ;
            return;

        } else {

            res.status(500).json({ "success": false, "message": "Failed to place order server facing issues try Again !" })

        }



    }

    catch (err) {

        console.log(err);

        res.status(500).json({ "success": false, "message": "Failed to place order server facing issues try Again !" })


    }
}

module.exports = {
    couponVerificationHandler,
    addressCouponAndItemsInputHandler,
    renderPaymentPage,
    placeCodOrderHandler
};