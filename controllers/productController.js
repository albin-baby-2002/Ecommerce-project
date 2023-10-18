// !importing necessary libraries and files

const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const WishList = require('../models/wishListModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel')
const { default: mongoose } = require('mongoose');



// ! This is not currently used as it is used instead of home page in user controller 

const renderSearchAndBuy = async (req, res, next) => {

    try {

        let search = '';

        if (req.query.search) {

            search = req.query.search.trim();
        }

        let page = 1;

        if (req.query.page) {
            page = req.query.page;
        }

        const categoryID = req.query.category;

        const limit = 9;

        const sortBy = req.query.sortBy;

        let sortQuery = {};

        if (sortBy) {

            if (sortBy === 'lowPrice') {

                sortQuery = { price: 1 };

            } else if (sortBy === 'highPrice') {

                sortQuery = { price: -1 };

            }
        }

        let filterQuery = {};

        if (search) {
            filterQuery.name = { $regex: search, $options: "i" };
        }

        if (categoryID) {
            filterQuery.category = categoryID;
        }
        const products = await Product.find(filterQuery)
            .sort(sortQuery)
            .skip((page - 1) * limit)
            .limit(limit * 1)
            .exec();



        const count = await Product.find(filterQuery).countDocuments();

        const categories = await Category.find({});

        res.render('users/searchAndBuy.ejs', {
            categories: categories,
            sortBy, categoryID,
            count,
            products: products,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            previous: page - 1,
            next: Number(page) + 1,
            limit: limit,
            search: search,
        });


        return;
    }
    catch (err) {
        next(err);
    }


}


//! render product details page 

const renderProductDetailsPage = async (req, res, next) => {


    try {

        const groupingID = req.params.groupingID;

        let filterQuery = { groupingID: Number(groupingID) };

        let color;
        let size;

        const colorList = await Product.find({ groupingID }).distinct('color');




        if (req.query.color) {
            color = req.query.color;

            filterQuery.color = color;
        }

        const sizeList = await Product.find({ groupingID, color }).distinct('size');




        if (req.query.size) {
            size = req.query.size;
            filterQuery.size = size;
        } else {
            size = sizeList[0];
            filterQuery.size = size;

        }

        console.log(filterQuery)

        console.log(groupingID + " " + size + " " + color + " ")


        const product = await Product.findOne(filterQuery).lean();




        const groupOfProducts = await Product.find({ groupingID }).lean();



        const variants = groupOfProducts.map((product) => {

            return { price: product.price, color: product.color, size: product.size, stock: product.stock }

        });

        console.log(product);



        res.render('users/productDetails.ejs', { product, currentColor: color, currentSize: size, colorList, sizeList, variants });

        return;
    }
    catch (err) {
        next(err);
    }


}


//! add to wishlist handler

const addToWishListHandler = async (req, res, next) => {



    try {

        if (!req.session.userID) {

            res.status(401).json({ "success": false, "message": "login to add product to wishlist" })

            return;
        }


        const { productID } = req.body;

        const product = await Product.findById(productID).lean();

        const userID = req.session.userID;

        const userData = await User.findById(userID).lean();



        if (!product) {

            console.log("Error finding productData : " + err);

            throw new Error();

        }


        if (!userData) {

            console.log("Error finding userData : " + err);

            throw new Error();

        }

        let userWishListID = userData.wishlist;


        if (!userWishListID) {

            const newWishList = new WishList({ userID });

            await newWishList.save()

            console.log('new wishlist created for user');

            userWishListID = newWishList._id;

            await User.findByIdAndUpdate(userID, { $set: { wishlist: userWishListID } });

        }


        const userWishListData = await WishList.findById(userWishListID).lean();

        if (!userWishListData) {

            console.log("Error : failed to get userWishList data ");


        }


        const productsInWishList = userWishListData.products;



        const productAlreadyInWishList = productsInWishList.find((existingProduct) => {


            return existingProduct.equals(product._id)
        });





        if (productAlreadyInWishList) {



            res.status(400).json({ "success": false, "message": "product already exists wishList!" });

            return;

        }



        await WishList.findByIdAndUpdate(userWishListID, { $push: { products: product._id } });

        res.status(201).json({ "success": true, "message": " Product Added to WishList !" });

        return;


    }
    catch (err) {

        console.log(err);

        res.status(500).json({ "success": false, "message": "failed try again Hint: server facing issues !" })

    }


}


//! render wishlistPage

const renderWishListPage = async (req, res, next) => {


    if (!req.session.userID) {



        req.session.message = {
            type: 'danger',
            message: 'Login to view your wishlist'
        }
        res.redirect('/');

        return;
    }


    try {

        const userID = req.session.userID;

        const userData = await User.findById(userID);

        const userWishListID = userData.wishlist;


        let productsInWishList;

        let result;

        try {

            result = await WishList.aggregate([
                {
                    $match: {
                        _id: userWishListID,
                    },
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'products',
                        foreignField: '_id',
                        as: 'wishlistProducts',
                    }
                }

            ])
                .exec()




        } catch (error) {
            console.error(error);
        }

        result.forEach((val) => {

            productsInWishList = val.wishlistProducts
        })



        res.render('users/wishlist.ejs', { products: productsInWishList });

        return;

    }
    catch (err) {
        next(err);
    }


}



// ! remove product from wishList Handler 

const removeFromWishListHandler = async (req, res, next) => {


    if (!req.session.userID) {



        req.session.message = {
            type: 'danger',
            message: 'Your session Timed out login to access wishlist'
        }
        res.redirect('/');

        return;
    }


    try {

        const { productID } = req.body;

        const userID = req.session.userID;

        const userData = await User.findById(userID);

        const userWishListID = userData.wishlist;

        const updatedWishList = await WishList.findByIdAndUpdate(userWishListID, { $pull: { products: productID } });

        if (updatedWishList) {

            res.status(201).json({
                "success": true,
                "message": "Removed item from wishlist"
            })
        } else {
            res.status(500).json({
                "success": true,
                "message": "failed to remove product from wishlist try again"
            })
        }


    }
    catch (err) {

        res.status(500).json({
            "success": true,
            "message": "failed to remove product from wishlist try again"
        })
    }


}

// ! render checkout page 

const renderCheckOutPage = async (req, res, next) => {





    try {

        if (!req.session.userID) {

            req.session.message = {
                type: 'danger',
                message: 'Login to view your Checkout Page'
            }
            res.redirect('/');

            return;
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


            res.redirect('/user/cart');

            return;

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

        }





        res.render('users/checkout.ejs', { Addresses, itemsInCart, totalPriceOfCart });

        return;

    }
    catch (err) {
        next(err);
    }


}

module.exports = {
    renderSearchAndBuy,
    renderProductDetailsPage,
    addToWishListHandler,
    renderWishListPage,
    removeFromWishListHandler,
    renderCheckOutPage
}