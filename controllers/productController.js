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

        return res.render('users/searchAndBuy.ejs', {
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



    }
    catch (err) {
        next(err);
    }


}

// ! render the home page 

const renderHomePage = async (req, res, next) => {

    try {

        const products = await Product.find()

            .limit(8)
            .exec();

        res.render('users/home.ejs', { products });

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




        const product = await Product.findOne(filterQuery).lean();

        const CategoryID = product.category;

        const CategoryData = await Category.findById(CategoryID);




        const groupOfProducts = await Product.find({ groupingID }).lean();



        const variants = groupOfProducts.map((product) => {

            return { price: product.price, color: product.color, size: product.size, stock: product.stock }

        });




        return res.render('users/productDetails.ejs', { product, currentColor: color, currentSize: size, colorList, sizeList, variants, category: CategoryData });


    }
    catch (err) {
        next(err);
    }


}

//! add to wishlist handler

const addToWishListHandler = async (req, res, next) => {



    try {

        if (!req.session.userID) {

            return res.status(401).json({ "success": false, "message": "login to add product to wishlist" })


        }


        const { productID } = req.body;

        const product = await Product.findById(productID).lean();

        const userID = req.session.userID;

        const userData = await User.findById(userID).lean();



        if (!product) {


            throw new Error();

        }


        if (!userData) {


            throw new Error();

        }

        let userWishListID = userData.wishlist;


        if (!userWishListID) {

            const newWishList = new WishList({ userID });

            await newWishList.save()


            userWishListID = newWishList._id;

            await User.findByIdAndUpdate(userID, { $set: { wishlist: userWishListID } });

        }


        const userWishListData = await WishList.findById(userWishListID).lean();

        if (!userWishListData) {



        }


        const productsInWishList = userWishListData.products;



        const productAlreadyInWishList = productsInWishList.find((existingProduct) => {


            return existingProduct.equals(product._id)
        });





        if (productAlreadyInWishList) {



            return res.status(400).json({ "success": false, "message": "product already exists wishList!" });



        }



        await WishList.findByIdAndUpdate(userWishListID, { $push: { products: product._id } });

        return res.status(201).json({ "success": true, "message": " Product Added to WishList !" });




    }
    catch (err) {


        return res.status(500).json({ "success": false, "message": "failed try again Hint: server facing issues !" })

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
        }

        result.forEach((val) => {

            productsInWishList = val.wishlistProducts
        })



        res.render('users/wishlist.ejs', { products: productsInWishList });



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


    }


    try {

        const { productID } = req.body;

        const userID = req.session.userID;

        const userData = await User.findById(userID);

        const userWishListID = userData.wishlist;

        const updatedWishList = await WishList.findByIdAndUpdate(userWishListID, { $pull: { products: productID } });

        if (updatedWishList) {

            return res.status(201).json({
                "success": true,
                "message": "Removed item from wishlist"
            })
        } else {
            return res.status(500).json({
                "success": true,
                "message": "failed to remove product from wishlist try again"
            })
        }


    }
    catch (err) {

        return res.status(500).json({
            "success": true,
            "message": "failed to remove product from wishlist try again"
        })
    }


}


module.exports = {
    renderSearchAndBuy,
    renderProductDetailsPage,
    addToWishListHandler,
    renderWishListPage,
    removeFromWishListHandler,
    renderHomePage
}