// ! importing necessary libraries and files

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const OtpData = require('../models/otpDataModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const CartItem = require('../models/cartItemModel');
const Product = require('../models/productModel');
const puppeteer = require('puppeteer');
const path = require('path');
const pdf = require('pdf-creator-node');
const ejs = require('ejs');

const fs = require('fs');
const userVerificationHelper = require('../helpers/userVerificationHelpers');
const dotenv = require('dotenv').config()

//! razorPay Instance

const Razorpay = require('razorpay');
const { log } = require('console');
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ! render orders page 

const orderPageRender = async (req, res, next) => {

    try {

        if (!req.session.userID) {

            req.session.message = {
                type: 'danger',
                message: 'login to view your orders !',

            };


            return res.redirect('/');




        }

        const userID = new mongoose.Types.ObjectId(req.session.userID);

        let orders = await User.aggregate([{
            $match: {
                _id: userID,
            }
        }, {
            $lookup: {
                from: 'orders',
                localField: 'orders',
                foreignField: '_id',
                as: 'ordersPlaced',
            }
        }, {
            $unwind: '$ordersPlaced'
        },
        {
            $replaceRoot: {
                newRoot: '$ordersPlaced'
            }
        }, {

            $match: {

                $and: [


                    {
                        orderStatus: {
                            $nin: ['clientSideProcessing', 'cancelled']
                        }
                    },

                    {
                        paymentStatus: {
                            $nin: ['pending', 'failed', 'refunded', 'cancelled']
                        }
                    },
                    { clientOrderProcessingCompleted: true }]
            },

        },

        {
            $lookup: {
                from: 'orderitems',
                localField: 'orderItems',
                foreignField: '_id',
                as: 'orderedItems',
            }
        }, {
            $unwind: '$orderedItems'
        },



        {
            $lookup: {
                from: 'products',
                localField: 'orderedItems.product',
                foreignField: '_id',
                as: 'orderedItems.productInfo'
            }
        },

        {
            $group: {
                _id: '$_id',
                userID: { $first: '$userID' },
                paymentMethod: { $first: '$paymentMethod' },
                paymentStatus: { $first: '$paymentStatus' },
                orderStatus: { $first: '$orderStatus' },
                shippingAddress: { $first: '$shippingAddress' },
                grossTotal: { $first: '$grossTotal' },
                couponApplied: { $first: '$couponApplied' },
                discountAmount: { $first: '$discountAmount' },
                categoryDiscount: { $first: '$categoryDiscount' },
                finalPrice: { $first: '$finalPrice' },
                clientOrderProcessingCompleted: { $first: '$clientOrderProcessingCompleted' },
                orderDate: { $first: '$orderDate' },
                orderedItems: { $push: '$orderedItems' }
            }
        }, {
            $project: {
                _id: 1,
                userID: 1,
                paymentMethod: 1,
                paymentStatus: 1,
                orderStatus: 1,
                shippingAddress: 1,
                grossTotal: 1,
                couponApplied: 1,
                categoryDiscount: 1,
                discountAmount: 1,
                finalPrice: 1,
                clientOrderProcessingCompleted: 1,
                orderDate: 1,
                orderedItems: {
                    $map: {
                        input: "$orderedItems",
                        as: "item",
                        in: {
                            _id: "$$item._id",
                            userID: "$$item.userID",
                            product: "$$item.product",
                            quantity: "$$item.quantity",
                            totalPrice: "$$item.totalPrice",
                            productInfo: {
                                name: { $arrayElemAt: ["$$item.productInfo.name", 0] },
                                price: { $arrayElemAt: ["$$item.productInfo.price", 0] },
                                color: { $arrayElemAt: ["$$item.productInfo.color", 0] },

                                images: { $arrayElemAt: ["$$item.productInfo.images", 0] },
                                onOffer: { $arrayElemAt: ["$$item.productInfo.onOffer", 0] },
                                offerPrice: { $arrayElemAt: ["$$item.productInfo.offerPrice", 0] }

                            }
                        }
                    }
                }
            }
        }, {
            $sort: {
                finalPrice: -1
            }
        }





        ]).exec()




        return res.render('users/allOrders.ejs', { orders });

    }
    catch (err) {



        next(err)
    }
}

// ! cancel orders

const cancelOrderHandler = async (req, res, next) => {

    try {


        if (!req.session.userID) {

            return res.status(401).json({ "success": false, "message": "Your session timedOut login to cancel order" })



        }

        const userID = new mongoose.Types.ObjectId(req.session.userID);

        const orderID = new mongoose.Types.ObjectId(req.params.orderID);

        const orderExist = await Order.findOne({ _id: orderID, userID });

        const orderPrice = orderExist.finalPrice;

        const products = await Order.aggregate([{
            $match: {
                _id: orderID,
                userID: userID
            }
        }
            , {
            $project: {
                orderItems: 1
            }
        }, {
            $lookup: {
                from: 'orderitems',
                localField: 'orderItems',
                foreignField: '_id',
                as: 'orderedProducts',
            }
        }, {
            $unwind: '$orderedProducts'
        }, {
            $replaceRoot: {
                newRoot: '$orderedProducts'
            }
        }, {
            $project: {
                product: 1,
                quantity: 1
            }
        }

        ])





        if (orderExist.orderStatus === 'delivered') {

            return res.status(400).json({ "success": false, "message": " The order is already delivered you can't cancel it " });



        }


        let cancelledOrder;


        if (orderExist instanceof Order && orderExist.paymentMethod === 'cod') {

            cancelledOrder = await Order.findByIdAndUpdate(orderExist._id, { $set: { orderStatus: 'cancelled' } });


        } else if (orderExist instanceof Order && orderExist.paymentMethod === 'onlinePayment' && orderExist.paymentStatus === 'paid') {


            cancelledOrder = await Order.findByIdAndUpdate(orderExist._id, { $set: { orderStatus: 'cancelled', paymentStatus: 'refunded' } });

        }




        if (cancelledOrder instanceof Order) {





            for (const product of products) {

                const updatedStock = await Product.findByIdAndUpdate(product.product, { $inc: { stock: product.quantity } });


            }

            if (orderExist instanceof Order && orderExist.paymentMethod === 'cod') {

                return res.status(200).json({ "success": true, "message": " Order Cancelled successfully" })


            }


            if (orderExist instanceof Order && orderExist.paymentMethod === 'onlinePayment') {

                const refund = await User.findByIdAndUpdate(userID, { $inc: { wallet: orderPrice } })

                if (refund instanceof User) {
                    return res.status(200).json({ "success": true, "message": " Order Cancelled successfully and price refunded" });

                    return
                }
                else {

                    return res.status(500).json({ "success": false, "message": " Order Cancelled successfully but failed to refund the price contact customer support" });

                    return
                }

            }




        } else {

            return res.status(500).json({ "success": false, "message": "server while trying to cancel the order" });


        }
    }


    catch (err) {

        return res.status(500).json({ "success": false, "message": "server facing issues try again " })


    }
}

// ! razor pay create order 

const razorPayCreateOrder = async (req, res, next) => {

    try {

        if (!req.session.userID) {

            return res.status(401).json({ 'success': false, "message": 'session timeout login to continue purchasing' });


        }

        const orderID = req.params.orderID;

        const userID = req.session.userID;

        const orderData = await Order.findById(orderID);

        if (!orderData) {

            return res.status(500).json({ 'success': false, "message": ' server facing issue getting order data' });



        }


        const amount = orderData.finalPrice * 100;

        const receipt = orderData._id.toString();

        const currency = 'INR';

        const options = {
            amount: amount,
            currency: currency,
            receipt: receipt
        };

        razorpay.orders.create(options, (err, order) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ 'success': false, "message": 'server facing issues when creating order' });
            }


            return res.status(200).json({ 'success': true, "message": 'continue', order });
        });


    }
    catch (err) {


        return res.status(500).json({ 'success': false, "message": 'server facing issues when creating order' })
    }
}


// !payment Success Handler

const paymentSuccessHandler = async (req, res, next) => {


    try {

        const userID = req.session.userID;

        const { receipt, id } = req.body;

        const orderID = new mongoose.Types.ObjectId(receipt);

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


        const updatedOrder = await Order.findByIdAndUpdate(orderID,
            {
                $set:
                {
                    paymentStatus: 'paid',
                    orderStatus: 'shipmentProcessing', clientOrderProcessingCompleted: true, razorpayTransactionId: id
                }
            });


        if (updatedOrder instanceof Order) {





            const userDataUpdate = await User.findByIdAndUpdate(userID, { $push: { orders: updatedOrder._id } })

            if (userDataUpdate instanceof User) {

                res.status(200).json({ 'success': true, "message": ' order placed successfully' });

                const userCart = await Cart.findOne({ userID: userID });

                const itemsInCart = userCart.items;



                for (const item of orderedItems) {

                    const updateProductQuantity = await Product.findByIdAndUpdate(item.product, { $inc: { stock: -(item.quantity) } })

                }


                const deletedCartItems = await CartItem.deleteMany({ _id: { $in: itemsInCart } });

                if (deletedCartItems.ok && deletedCartItems.n === itemsInCart.length && deletedCartItems.deletedCount === itemsInCart.length) {

                    const updatedCart = await Cart.findByIdAndUpdate(userCart._id, { $set: { items: [] } });



                }

            } else {
                return res.status(500).json({ 'success': false, "message": ' Payment successful but server facing error updating order info contact customer service' })
            }



        } else {

            return res.status(500).json({ 'success': false, "message": ' Payment successful but server facing error updating order info contact customer service' })
        }

    }
    catch (err) {


        return res.status(500).json({ 'success': false, "message": ' Payment successful but server facing error updating order info contact customer service' })
    }
}


// ! render order details page 

const renderOrderDetails = async (req, res, next) => {

    try {


        if (!req.session.userID) {


            req.session.message = {
                type: 'danger',
                message: 'session time out login to got to order details page  !',

            };

            return res.redirect('/');


        }

        const userID = new mongoose.Types.ObjectId(req.session.userID);


        const orderID = new mongoose.Types.ObjectId(req.params.orderID);

        if (!orderID) {

            req.session.message = {
                type: 'danger',
                message: 'Failed to Fetch order Details  !',

            };

            return res.redirect('/user/orders');


        }



        const orderData = await Order.findById(orderID);


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






        if (orderData && productsData && address) {





            return res.render('users/orderDetailsPage.ejs', { address, orderData, productsData });




        } else {

            req.session.message = {
                type: 'danger',
                message: 'Failed to Fetch order Details  !',

            };

            return res.redirect('/user/orders');




        }

    }

    catch (err) {

    }
}


// ! render invoice page 

const renderInvoicePage = async (req, res, next) => {

    try {




        const orderID = new mongoose.Types.ObjectId(req.params.orderID);

        if (!orderID) {

            req.session.message = {
                type: 'danger',
                message: 'Failed to Fetch order Details  !',

            };

            return res.redirect('/user/orders');


        }



        const orderData = await Order.findById(orderID);


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



        if (orderData && productsData && address) {





            return res.render('users/invoicePage.ejs', { address, orderData, productsData });




        } else {

            req.session.message = {
                type: 'danger',
                message: 'Failed to Fetch order Details  !',

            };

            return res.redirect('/user/orders');




        }

    }

    catch (err) {

        next(err)
    }
}

// ! download sales invoice handler

const downloadInvoice = async (req, res, next) => {

    try {


        if (!req.session.userID) {


            req.session.message = {
                type: 'danger',
                message: 'session time out login to got to render invoice  !',

            };

            return res.redirect('/');


        }


        const orderID = new mongoose.Types.ObjectId(req.params.orderID);

        if (!orderID) {

            req.session.message = {
                type: 'danger',
                message: 'Failed to Fetch order Details  !',

            };

            return res.redirect('/user/orders');


        }


        const orderData = await Order.findById(orderID);


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



        if (orderData && productsData && address) {


            const options = {
                formate: 'A3',
                orientation: 'portrait',
                border: '2mm',
                header: {
                    height: '15mm',
                    contents: '<h4 style=" color: red;font-size:20;font-weight:800;text-align:center;">CUSTOMER INVOICE</h4>'
                },
                footer: {
                    height: '20mm',
                    contents: {
                        first: 'Cover page',
                        2: 'Second page',
                        default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>',
                        last: 'Last Page'
                    }
                }
            }

            const data = { orderData, productsData, address }

            const html = ejs.render(fs.readFileSync(path.join(__dirname, '..', 'views', 'users', 'invoicePage.ejs'), 'utf-8'), data);


            const filename = Math.random() + '_doc' + '.pdf';


            const document = {
                html: html,
                data,
                path: './docs/' + filename
            }


            pdf.create(document, options)
                .then(re => {
                    console.log(re);

                    const filepath = path.join(__dirname, '..', 'docs', filename);





                    res.download(filepath, function (err) {

                        if (err) {
                            console.log(err)
                        }
                    })

                }).catch(error => {
                    console.log(error);
                });


        }










        // let orderID = req.params.orderID;


        // const browser = await puppeteer.launch();
        // const page = await browser.newPage();


        // await page.setViewport({
        //     width: 1680,
        //     height: 800,
        // });

        // await page.goto(`${req.protocol}://${req.get('host')}` + '/user/invoice/' + `${orderID}`, { waitUntil: 'networkidle2' });









        // const date = new Date();

        // const pdfn = await page.pdf({
        //     path: `${path.join(__dirname, '../public/files/salesReport', date.getTime() + '.pdf')}`,
        //     printBackground: true,
        //     format: "A4"
        // })

        // setTimeout(async () => {
        //     await browser.close();


        //     const pdfURL = path.join(__dirname, '../public/files/salesReport', date.getTime() + '.pdf');




        //     res.download(pdfURL, function (err) {

        //         if (err) {
        //             console.log(err)
        //         }
        //     })


        // }, 1000);





    }
    catch (err) {

        next(err);
    }
}

module.exports = {
    orderPageRender,
    cancelOrderHandler,
    razorPayCreateOrder,
    paymentSuccessHandler,
    renderOrderDetails,
    renderInvoicePage,
    downloadInvoice

}