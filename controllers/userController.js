// ! importing necessary libraries and files

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const OtpData = require('../models/otpDataModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const userVerificationHelper = require('../helpers/userVerificationHelpers');




// !render Home page

const renderHomePage = async (req, res, next) => {

    try {


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

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    try {

        const { name, email, password, phone } = req.body;

        // validating input data before creating the user

        if (!name || !email || !password || !phone) {

            req.session.message = {
                type: 'danger',
                message: 'All Fields Are Mandatory'
            }

        } else if (!passwordRegex.test(password)) {

            req.session.message = {
                type: 'danger',
                message: 'The password should contain at-least one capital letter one small letter and one symbol from (@, $, !, %, *, ?, or &) and should be eight character long '
            }
        }

        else if (!nameRegex.test(name)) {

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


        if (req.session.userID || (!req.session.passwordResetToken && !req.session.verificationToken)) {

            res.status(500).json({ "success": false, 'message': "Error: Session Time Out Try Again !" });

            return;
        }

        const userID = req.session.passwordResetToken ? req.session.passwordResetToken : req.session.verificationToken;

        const user = await User.findOne({ _id: userID });




        const otpSend = userVerificationHelper.sendOtpEmail(user, res);

        if (otpSend) {

            res.status(201).json({ "success": true });


            return;

        } else {

            res.status(500).json({ "success": false, 'message': "Server facing some issues try again  !" });

            console.log('failed')

            return;
        }




    }

    catch (err) {

        res.status(500).json({ "success": false, 'message': `${err}` });

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

                res.redirect('/user/forgotPassword/verifyOTP');
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

// ! forgot password otp verify page render 

const renderForgotPasswordVerifyOtpPage = async (req, res, next) => {


    if (req.session.userID || !req.session.passwordResetToken) {

        req.session.message = {
            type: 'danger',
            message: 'Session timeout try again !',

        };

        res.redirect('/');

        return;

    } else if (req.session.passwordResetToken && req.session.emailVerifiedForPasswordReset) {

        res.redirect('/user/resetPassword');

        return;
    }


    try {

        res.render('users/passwordResetOtpVerification.ejs');

        return;

    }
    catch (err) {
        next(err);
    }


}

//!forgot password verify otp and redirect to reset password page


const forgotPasswordVerifyOtpHandler = async (req, res, next) => {

    if (req.session.userID || !req.session.passwordResetToken) {

        req.session.message = {
            type: 'danger',
            message: 'Session timeout try again !',

        };

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


    if (req.session.userID || !req.session.passwordResetToken || !req.session.emailVerifiedForPasswordReset) {

        req.session.message = {
            type: 'danger',
            message: 'Session timeout try again !',

        };

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




    try {

        if (req.session.userID) {

            res.redirect('/');

            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        const { password } = req.body;




        if (req.session.emailVerifiedForPasswordReset && req.session.passwordResetToken) {

            if (!password) {

                req.session.message = {
                    type: 'danger',
                    message: 'Failed: Enter the password  !',

                };

                res.redirect('/user/forgotPassword');
                return;


            } else if (!passwordRegex.test(password)) {

                req.session.message = {
                    type: 'danger',
                    message: 'The password should contain at-least one capital letter one small letter and one symbol and should be eight character long'
                }

                res.redirect('/user/forgotPassword');
                return;
            }

            else {

                const userId = req.session.passwordResetToken;

                const user = await User.findById(userId);

                if (user) {

                    const hashedPassword = await bcrypt.hash(password, 10);

                    const updateUser = await User.findByIdAndUpdate(userId, { $set: { password: hashedPassword } });

                    if (updateUser) {



                        req.session.message = {
                            type: 'success',
                            message: 'Password reset successful now you can login '

                        };

                        req.session.destroy();

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

// ! add new delivery address handler

const addNewDeliveryAddress = async (req, res, next) => {

    try {


        if (!req.session.userID) {

            res.status(401).json({ "success": false, "message": "Your session timedOut login to add New Address" })

            return;
        }

        const userID = req.session.userID;

        let { fullName, country, phone, locality, city, addressLine, state, pinCode } = req.body;

        console.log(req.body);

        if (!fullName || !country || !phone || !locality || !city || !addressLine || !state || !pinCode) {

            res.status(400).json({ "success": false, "message": " Failed to create new Address all fields are mandatory  !" })
        }

        const newAddress = new Address({ userID, fullName, country, phone, locality, city, addressLine, state, pinCode });

        savedAddress = await newAddress.save();

        if (savedAddress instanceof Address) {

            const updatedUser = await User.findByIdAndUpdate(userID, { $push: { addresses: savedAddress._id } });

            if (updatedUser instanceof User) {

                res.status(201).json({ "success": true, "message": " New Delivery Address Added successfully" })
            }
            else {

                res.status(500).json({ "success": false, "message": " Failed to create new Address . Server facing issues!" })
            }

        }
        else {

            res.status(500).json({ "success": false, "message": " Failed to create new Address . Server facing issues!" })

        }




    }
    catch (err) {
        next(err);
    }


}

// ! render user profile page 

const renderUserProfile = async (req, res, next) => {

    try {

        if (!req.session.userID) {


            req.session.message = {
                type: 'danger',
                message: 'Login to view profile !',

            };

            res.redirect('/');
            return;
        }

        const userID = req.session.userID;

        let user = await User.findById(userID).lean();

        firstName = user.name.split(' ')[0];

        lastName = user.name.split(' ')[1];

        joined_date = user.joined_date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

        user = { ...user, firstName, lastName, joined_date };



        console.log(user);



        res.render('users/myAccount.ejs', { user });

    }
    catch (err) {

        console.log(err);

        next(err)
    }
}

// !render edit profile page

const renderEditProfilePage = async (req, res, next) => {

    try {

        if (!req.session.userID) {


            req.session.message = {
                type: 'danger',
                message: 'Session time out login  profile !',

            };

            res.redirect('/');
            return;
        }


        const userID = req.session.userID;

        let user = await User.findById(userID).lean();

        firstName = user.name.split(' ')[0];

        lastName = user.name.split(' ')[1];

        joined_date = user.joined_date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

        user = { ...user, firstName, lastName, joined_date };

        res.render('users/editProfile.ejs', { user })

    }
    catch (err) {
        console.log(err);

        next(err)
    }
}

// ! edit profile handler 

const editProfileHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            res.status(401).json({ "success": false, "message": "Your session timedOut login to edit profile" })

            return;
        }

        const userID = req.session.userID;

        const { firstName, lastName, phone } = req.body;

        const newName = firstName.trim() + " " + lastName.trim();

        const updatedUser = await User.findByIdAndUpdate(userID, { $set: { name: newName, phone } });

        if (updatedUser instanceof User) {

            res.status(201).json({ "success": true, "message": "Your profile is updated !" });

            return;
        }

        res.status(500).json({ "success": false, "message": "Failed to update the Profile Hint: server facing issues !" })

    }
    catch (err) {

        res.status(500).json({ "success": false, "message": "Failed to update the Profile Hint: server facing issues !" })

    }
}

// ! change password handler 

const changePasswordHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            res.status(401).json({ "success": false, "message": "Your session timedOut login to edit profile" })

            return;
        }

        const userID = req.session.userID;

        const userData = await User.findById(userID);

        const password = userData.password;

        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        const { currentPassword, newPassword } = req.body;

        if (! await bcrypt.compare(currentPassword, password)) {


            res.status(401).json({ "success": false, "message": "Enter the right current password ! " })


            return;
        }


        if (!passwordRegex.test(newPassword)) {

            res.status(400).json({ "success": false, "message": "The new  password should contain at-least one capital letter one small letter and one symbol from (@, $, !, %, *, ?, or &) and should be eight character long  " });

            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (!hashedPassword) {


            res.status(500).json({ "success": false, "message": " Failed to change password due to server issues  " });

            return;
        }

        const updatedData = await User.findByIdAndUpdate(userID, { $set: { password: hashedPassword } });


        if (updatedData instanceof User) {

            res.status(201).json({ "success": true, "message": " Your password is changed  !" });

            return;

        }


        res.status(500).json({ "success": false, "message": " Failed to change password due to server issues  " });

        return;

    }
    catch (err) {

        res.status(500).json({ "success": false, "message": "Failed to update the Profile Hint: server facing issues !" })

    }
}

// ! render orders page 

const orderPageRender = async (req, res, next) => {

    try {

        if (!req.session.userID) {

            req.session.message = {
                type: 'danger',
                message: 'login to view your orders !',

            };


            res.redirect('/');


            return;

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
        }, {
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
                                color: { $arrayElemAt: ["$$item.productInfo.color", 0] }

                            }
                        }
                    }
                }
            }
        }





        ]).exec()

        console.log('\n\n\n' + JSON.stringify(orders, null, 2) + '\n\n\n');


        res.render('users/allOrders.ejs', { orders });

    }
    catch (err) {

        console.log(err);

        next(err)
    }
}

// ! cancel orders

const cancelOrderHandler = async (req, res, next) => {

    try {


        if (!req.session.userID) {

            res.status(401).json({ "success": false, "message": "Your session timedOut login to cancel order" })

            return;

        }

        const userID = req.session.userID;

        const orderID = req.params.orderID;

        const orderExist = await Order.findOne({ _id: orderID, userID });

        if (orderExist instanceof Order && orderExist.paymentMethod === 'cod') {

            const cancelledOrder = await Order.findByIdAndUpdate(orderExist._id, { $set: { orderStatus: 'cancelled' } });

            if (cancelledOrder instanceof Order) {

                res.status(200).json({ "success": true, "message": " Order Cancelled successfully" })

                return;

            } else {

                res.status(500).json({ "success": false, "message": "server while trying to cancel the order" });

                return;
            }

        } else {
            res.status(500).json({ "success": false, "message": "server while trying to cancel the order" });
        }
    }


    catch (err) {

        res.status(500).json({ "success": false, "message": "server facing issues try again " })

        return;
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
    resendOtpHandler,
    renderForgotPasswordPage,
    forgotPasswordHandler,
    forgotPasswordVerifyOtpHandler,
    renderResetPasswordPage,
    resetPasswordHandler,
    renderForgotPasswordVerifyOtpPage,
    addNewDeliveryAddress,
    renderUserProfile,
    renderEditProfilePage,
    editProfileHandler,
    changePasswordHandler,
    orderPageRender,
    cancelOrderHandler
}