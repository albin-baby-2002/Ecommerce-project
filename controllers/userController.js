// importing necessary libraries and files

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/userModel');
const OtpData = require('../models/otpDataModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const WishList = require('../models/wishListModel');
const Cart = require('../models/cartModel');
const CartItem = require('../models/cartItemModel');

const userVerificationHelper = require('../helpers/userVerificationHelpers')



// !render Home page

const renderHomePage = async (req, res, next) => {

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

// !signup page render 

const renderSignUpPage = (req, res, next) => {


    // check whether the user is logged. If logged in redirect to home

    if (req.session.userID) {

        res.redirect('/');

        return;
    }

    try {

        res.render('users/signUp.ejs');

        return;
    }
    catch (err) {
        next(err);
    }


}

//! signup validation 

const signUpHandler = async (req, res, next) => {

    //regex for checking name and email

    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)?$/;

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    try {

        const { name, email, password, phone } = req.body;

        // validating input data before creating the user

        if (!name || !email || !password || !phone) {

            req.session.message = {
                type: 'danger',
                message: 'All Fields Are Mandatory'
            }

        } else if (!nameRegex.test(name)) {

            req.session.message = {
                type: 'danger',
                message: 'Invalid Name: make sure name only contain letters'
            }
        }
        else if (!emailRegex.test(email)) {

            req.session.message = {
                type: 'danger',
                message: 'Invalid Email: make sure email id is entered correctly'
            }
        }

        // redirecting with error message if data validation failed 

        if (req.session.message && req.session.message.type === 'danger') {
            res.redirect('/user/signUp');
            return;
        }

        //checking if email is already registered

        const existingUser = await User.findOne({ email });


        if (existingUser) {

            req.session.message = {
                type: 'danger',
                message: 'Invalid Email: This email address is already registered'
            };

            res.redirect('/user/signUp');
            return;

        } else {

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = new User({ name, email, phone, password: hashedPassword });

            user.save()

                .then((user) => {


                    req.session.message = {
                        type: 'success',
                        message: 'Your Registration Is Successful !'
                    };

                    req.session.verificationToken = user._id;

                    const isOtpSend = userVerificationHelper.sendOtpEmail(user, res);

                    if (isOtpSend) {
                        res.redirect('/user/verifyOTP');
                        return;

                    } else {

                        req.session.message = {
                            type: 'danger',
                            message: 'verification failed : try verify your email using : ',
                            verification: true
                        };

                        res.redirect('/user/signUp');
                        return;


                    }
                })

                .catch((err) => {


                    req.session.message = {
                        type: 'danger',
                        message: 'Sorry: Your Registration Failed ! Try again'
                    };

                    res.redirect('/user/signUp.ejs');

                    return;
                })


        }

    }
    catch (err) {
        console.log(err)
        next(err)
    }
}

// !otp verification page render 


const renderOtpVerificationPage = async (req, res, next) => {


    if (req.session.userID || !req.session.verificationToken) {

        res.redirect('/');
        return;
    }

    try {

        res.render('users/verifyOtpPage.ejs');
        return;

    }

    catch (err) {
        next(err);
    }
}

//!otp verification handler

const otpVerificationHandler = async (req, res, next) => {


    try {

        const { otp } = req.body;

        if (req.session.verificationToken) {

            const otpVerificationData = await OtpData.findOne({ userId: req.session.verificationToken });

            if (otpVerificationData) {

                if (await bcrypt.compare(otp, otpVerificationData.otp)) {

                    const updateUser = await User.updateOne({ _id: req.session.verificationToken }, { $set: { verified: true } });

                    if (updateUser) {

                        req.session.destroy();

                        req.session.message = {
                            type: 'success',
                            message: 'otp verification completed now you can login'
                        }

                        res.redirect('/user/login');

                        return;
                    }
                }
                else {

                    req.session.message = {
                        type: 'danger',
                        message: 'otp verification failed.enter the right otp'
                    }

                    res.redirect('/user/verifyOTP');

                    return;



                }

            } else {

                req.session.message = {
                    type: 'danger',
                    message: 'otp got expired try again ,try logging in we will give the option to verify your mail'
                }

                res.redirect('/user/login');

                return;

            }



        } else {

            req.session.message = {
                type: 'danger',
                message: 'session time out : otp verification failed try logging in we will give the option to verify your mail'
            }

            res.redirect('/user/login');

            return;
        }



    }

    catch (err) {
        next(err);
    }
}

//!resend otp handler

const resendOtpHandler = async (req, res, next) => {


    try {

        const user = await User.findOne({ _id: req.session.verificationToken });




        const otpSend = userVerificationHelper.sendOtpEmail(user, res);

        if (otpSend) {

            res.status(201).json({ "success": true });


            return;

        } else {

            res.status(500).json({ "success": false });

            console.log('failed')

            return;
        }




    }

    catch (err) {
        next(err);
    }
}


//!login page render

const renderLoginPage = (req, res, next) => {


    if (req.session.userID) {

        res.redirect('/');
        return;
    }

    try {
        res.render('users/login.ejs');
        return;
    }
    catch (err) {
        next(err);
    }


};

//!login handler 


const loginHandler = async (req, res, next) => {

    try {

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        const { email, password } = req.body;



        if (!email || !password) {

            req.session.message = {
                type: 'danger',
                message: 'All Fields Are Mandatory'
            }

        }
        else if (!emailRegex.test(email)) {

            req.session.message = {
                type: 'danger',
                message: 'Invalid Email: make sure email id is entered correctly'
            }
        }

        // redirecting with error if data validation failed 

        if (req.session.message && req.session.message.type === 'danger') {
            res.redirect('/user/login');
            return;
        }

        const user = await User.findOne({ email });

        if (user) {


            if (await bcrypt.compare(password, user.password)) {


                if (user.verified === true) {

                    if (user.blocked) {

                        req.session.message = {
                            type: 'danger',
                            message: 'You are blocked by the admin'
                        }

                        res.redirect('/user/login');

                        return;


                    } else {

                        req.session.userID = user._id;

                        req.session.message = {
                            type: 'success',
                            message: ' You have successfully logged in '
                        }

                        res.redirect('/');

                        return;
                    }



                } else {

                    req.session.message = {
                        type: 'danger',
                        message: 'Email address is not verified',
                        verification: true
                    }


                    if (!req.session.verificationToken) {

                        req.session.verificationToken = user._id;

                    }


                    res.redirect('/user/login');

                    return;

                }

            } else {

                req.session.message = {
                    type: 'danger',
                    message: 'You entered the wrong password'
                }

                res.redirect('/user/login');

                return;

            }



        }
        else {

            req.session.message = {
                type: 'danger',
                message: 'Invalid Email: make sure email id is registered '
            }

            res.redirect('/user/login');

            return;

        }




    }
    catch (err) {
        next(err);
    }


}

//!logout handler 

const logoutHandler = async (req, res, next) => {

    try {

        req.session.destroy();

        res.redirect('/');

        return;

    }
    catch (err) {
        next(err)
    }

}


// !To verify email by resending otp if signup otp verification failed


const verifyEmailHandler = async (req, res, next) => {

    const existingOtpData = await OtpData.findOne({ userId: req.session.verificationToken });

    const user = await User.findOne({ _id: req.session.verificationToken });


    if (existingOtpData) {

        const deletedOldOtpData = await OtpData.deleteOne({ userId: user._id });



        if (deletedOldOtpData.deletedCount === 1) {

            const otpIsSend = userVerificationHelper.sendOtpEmail(user, res);

            if (otpIsSend) {

                res.redirect('/user/verifyOTP');
                return;

            } else {

                req.session.message = {
                    type: 'danger',
                    message: 'verification failed',
                    verification: true
                };

                res.redirect('/user/login');
                return;


            }



        } else {

            if (user) {

                req.session.message = {
                    type: 'danger',
                    message: 'Error verifying email : try again ',
                    verification: true
                }

                res.redirect('/user/login');

                return;

            }
            else {

                req.session.message = {
                    type: 'danger',
                    message: 'Error verifying email : try again ',

                }

                res.redirect('/user/login');

                return;

            }



        }

    } else {

        userVerificationHelper.sendOtpEmail(user, res);

        return;


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




        const groupOfProducts = await Product.find({ groupingID }).lean();



        const variants = groupOfProducts.map((product) => {

            return { price: product.price, color: product.color, size: product.size, stock: product.stock }

        });



        res.render('users/productDetails.ejs', { product, currentColor: color, currentSize: size, colorList, sizeList, variants });

        return;
    }
    catch (err) {
        next(err);
    }


}

//! forgot password page render 

const renderForgotPasswordPage = async (req, res, next) => {


    if (req.session.userID) {

        res.redirect('/');

        return;
    }


    try {

        res.render('users/forgotPassword.ejs');

        return;

    }
    catch (err) {
        next(err);
    }


}

//! forgot password handler to send otp

const forgotPasswordHandler = async (req, res, next) => {

    if (req.session.userID) {

        res.redirect('/');

        return;
    }


    try {

        const { email } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {

            req.session.passwordResetToken = existingUser._id;

            const otpSend = userVerificationHelper.sendOtpEmail(existingUser, res);

            if (otpSend) {

                res.render('users/passwordResetOtpVerification.ejs')
                return;

            } else {
                req.session.message = {
                    type: 'danger',
                    message: 'Failed to send the otp try again !',

                };

                res.redirect('/user/forgotPassword');
                return;

            }




        } else {

            req.session.message = {
                type: 'danger',
                message: 'Enter a valid email id',

            };

            res.redirect('/user/forgotPassword');
            return;

        }



    }
    catch (err) {
        next(err);
    }


}

//!forgot password verify otp and render page to reset password


const forgotPasswordVerifyOtpHandler = async (req, res, next) => {

    if (req.session.userID) {

        res.redirect('/');

        return;
    }


    try {



        const { otp } = req.body;

        const user_ID = req.session.passwordResetToken;

        if (user_ID) {

            const otpData = await OtpData.findOne({ userId: user_ID });



            if (otpData && await bcrypt.compare(otp, otpData.otp)) {


                req.session.emailVerifiedForPasswordReset = true;


                res.redirect('/user/resetPassword');


            } else {

                req.session.message = {
                    type: 'danger',
                    message: 'Otp invalid try again !',

                };

                res.redirect('/user/forgotPassword');
                return;

            }


        } else {

            req.session.message = {
                type: 'danger',
                message: 'Session time out: Try Again !',

            };

            res.redirect('/user/forgotPassword');
            return;

        }


    }
    catch (err) {
        next(err);
    }


}

//! render res set password page 

const renderResetPasswordPage = async (req, res, next) => {


    if (req.session.userID || !req.session.passwordResetToken) {

        res.redirect('/');

        return;
    }


    try {

        res.render('users/passwordResetPage.ejs');

        return;

    }
    catch (err) {
        next(err);
    }


}

//! res setting password handler 

const resetPasswordHandler = async (req, res, next) => {

    if (req.session.userID) {

        res.redirect('/');

        return;
    }


    try {

        const { password } = req.body;




        if (req.session.emailVerifiedForPasswordReset && req.session.passwordResetToken) {

            if (!password) {

                req.session.message = {
                    type: 'danger',
                    message: 'Failed: Enter the password  !',

                };

                res.redirect('/user/forgotPassword');
                return;


            } else {

                const userId = req.session.passwordResetToken;

                const user = await User.findById(userId);

                if (user) {

                    const hashedPassword = await bcrypt.hash(password, 10);

                    const updateUser = await User.findByIdAndUpdate(userId, { $set: { password: hashedPassword } });

                    if (updateUser) {

                        req.session.message = {
                            type: 'success',
                            message: 'Password reset successful now you can login ',

                        };

                        res.redirect('/user/login');
                        return;

                    }


                } else {

                    req.session.message = {
                        type: 'danger',
                        message: 'Failed to rest password. Try Again !',

                    };

                    res.redirect('/user/forgotPassword');
                    return;

                }

            }

        } else {

            req.session.message = {
                type: 'danger',
                message: 'Session time out: Try Again !',

            };

            res.redirect('/user/forgotPassword');
            return;

        }







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

        console.log(itemsInCart)







        res.render('users/shoppingCart.ejs', { itemsInCart });

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

module.exports = {
    renderLoginPage,
    renderSignUpPage,
    signUpHandler,
    renderOtpVerificationPage,
    otpVerificationHandler,
    loginHandler,
    verifyEmailHandler,
    logoutHandler,
    renderHomePage,
    renderProductDetailsPage,
    resendOtpHandler,
    renderForgotPasswordPage,
    forgotPasswordHandler,
    forgotPasswordVerifyOtpHandler,
    renderResetPasswordPage,
    resetPasswordHandler,
    addToWishListHandler,
    renderWishListPage,
    removeFromWishListHandler,
    addToCartHandler,
    renderCartPage,
    deleteItemFromCartHandler,
    reduceCartItemQuantityHandler
}