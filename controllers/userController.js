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
const userVerificationHelper = require('../helpers/userVerificationHelpers');

const dotenv = require('dotenv').config()


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

        return res.redirect('/');


    }

    try {

        return res.render('users/signUp.ejs');


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

        const { name, email, password, phone, referralEmail } = req.body;

        let referrer;

        if (referralEmail) {

            referrer = await User.findOne({ email: referralEmail });

        }

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
                message: 'Invalid Name: make sure name only contain  letters and first name and last name only'
            }
        }
        else if (!emailRegex.test(email)) {

            req.session.message = {
                type: 'danger',
                message: 'Invalid Email: make sure email id is entered correctly'
            }
        } else if (referralEmail && !(referrer instanceof User)) {

            req.session.message = {
                type: 'danger',
                message: 'Enter a valid referrer email ID'
            }
        }

        // redirecting with error message if data validation failed 

        if (req.session.message && req.session.message.type === 'danger') {
            return res.redirect('/user/signUp');

        }

        //checking if email is already registered

        const existingUser = await User.findOne({ email });


        if (existingUser) {

            req.session.message = {
                type: 'danger',
                message: 'Invalid Email: This email address is already registered'
            };

            return res.redirect('/user/signUp');


        } else {

            const hashedPassword = await bcrypt.hash(password, 10);

            const savedUser = new User({ name, email, phone, password: hashedPassword });

            savedUser.save()

                .then((savedUser) => {

                    if (referrer) {
                        referrer.wallet += 10;

                        referrer.totalReferralReward += 10;

                        referrer.successfulReferrals.push(savedUser.email);

                        referrer.save();

                        savedUser.wallet += 10;

                        savedUser.save();
                    }



                    req.session.message = {
                        type: 'success',
                        message: 'Your Registration Is Successful !'
                    };

                    req.session.verificationToken = savedUser._id;

                    const isOtpSend = userVerificationHelper.sendOtpEmail(savedUser, res);

                    if (isOtpSend) {
                        return res.redirect('/user/verifyOTP');


                    } else {

                        req.session.message = {
                            type: 'danger',
                            message: 'verification failed : try verify your email using : ',
                            verification: true
                        };

                        return res.redirect('/user/signUp');



                    }
                })

                .catch((err) => {


                    req.session.message = {
                        type: 'danger',
                        message: 'Sorry: Your Registration Failed ! Try again'
                    };

                    return res.redirect('/user/signUp.ejs');


                })


        }

    }
    catch (err) {

        next(err)
    }
}

// !otp verification page render 

const renderOtpVerificationPage = async (req, res, next) => {


    if (req.session.userID || !req.session.verificationToken) {

        return res.redirect('/');

    }

    try {

        return res.render('users/verifyOtpPage.ejs');


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



                        req.session.message = {
                            type: 'success',
                            message: 'otp verification completed now you can login'
                        }

                        req.session.destroy();

                        return res.redirect('/user/login');


                    }
                }
                else {

                    req.session.message = {
                        type: 'danger',
                        message: 'otp verification failed.enter the right otp'
                    }

                    return res.redirect('/user/verifyOTP');





                }

            } else {

                req.session.message = {
                    type: 'danger',
                    message: 'otp got expired try again ,try logging in we will give the option to verify your mail'
                }

                return res.redirect('/user/login');



            }



        } else {

            req.session.message = {
                type: 'danger',
                message: 'session time out : otp verification failed try logging in we will give the option to verify your mail'
            }

            return res.redirect('/user/login');


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

            return res.status(500).json({ "success": false, 'message': "Error: Session Time Out Try Again !" });


        }

        const userID = req.session.passwordResetToken ? req.session.passwordResetToken : req.session.verificationToken;

        const user = await User.findOne({ _id: userID });




        const otpSend = userVerificationHelper.sendOtpEmail(user, res);

        if (otpSend) {

            return res.status(201).json({ "success": true });




        } else {

            return res.status(500).json({ "success": false, 'message': "Server facing some issues try again  !" });




        }




    }

    catch (err) {

        return res.status(500).json({ "success": false, 'message': `${err}` });

    }
}


//!login page render

const renderLoginPage = (req, res, next) => {


    if (req.session.userID) {

        return res.redirect('/');

    }

    try {
        return res.render('users/login.ejs');

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
            return res.redirect('/user/login');

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

                        return res.redirect('/user/login');




                    } else {

                        req.session.userID = user._id;

                        req.session.message = {
                            type: 'success',
                            message: ' You have successfully logged in '
                        }

                        return res.redirect('/');


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


                    return res.redirect('/user/login');



                }

            } else {

                req.session.message = {
                    type: 'danger',
                    message: 'You entered the wrong password'
                }

                return res.redirect('/user/login');



            }



        }
        else {

            req.session.message = {
                type: 'danger',
                message: 'Invalid Email: make sure email id is registered '
            }

            return res.redirect('/user/login');



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

        return res.redirect('/');



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

                return res.redirect('/user/verifyOTP');


            } else {

                req.session.message = {
                    type: 'danger',
                    message: 'verification failed',
                    verification: true
                };

                return res.redirect('/user/login');



            }



        } else {

            if (user) {

                req.session.message = {
                    type: 'danger',
                    message: 'Error verifying email : try again ',
                    verification: true
                }

                return res.redirect('/user/login');



            }
            else {

                req.session.message = {
                    type: 'danger',
                    message: 'Error verifying email : try again ',

                }

                return res.redirect('/user/login');



            }



        }

    } else {

        userVerificationHelper.sendOtpEmail(user, res);




    }
}

//! forgot password page render 

const renderForgotPasswordPage = async (req, res, next) => {


    if (req.session.userID) {

        return res.redirect('/');


    }


    try {

        return res.render('users/forgotPassword.ejs');



    }
    catch (err) {
        next(err);
    }


}

//! forgot password handler to send otp

const forgotPasswordHandler = async (req, res, next) => {

    if (req.session.userID) {

        return res.redirect('/');


    }


    try {

        const { email } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {

            req.session.passwordResetToken = existingUser._id;

            const otpSend = userVerificationHelper.sendOtpEmail(existingUser, res);

            if (otpSend) {

                return res.redirect('/user/forgotPassword/verifyOTP');


            } else {
                req.session.message = {
                    type: 'danger',
                    message: 'Failed to send the otp try again !',

                };

                return res.redirect('/user/forgotPassword');


            }




        } else {

            req.session.message = {
                type: 'danger',
                message: 'Enter a valid email id',

            };

            return res.redirect('/user/forgotPassword');


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

        return res.redirect('/');



    } else if (req.session.passwordResetToken && req.session.emailVerifiedForPasswordReset) {

        return res.redirect('/user/resetPassword');


    }


    try {

        return res.render('users/passwordResetOtpVerification.ejs');



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

        return res.redirect('/');


    }


    try {



        const { otp } = req.body;

        const user_ID = req.session.passwordResetToken;

        if (user_ID) {

            const otpData = await OtpData.findOne({ userId: user_ID });



            if (otpData && await bcrypt.compare(otp, otpData.otp)) {


                req.session.emailVerifiedForPasswordReset = true;


                return res.redirect('/user/resetPassword');


            } else {

                req.session.message = {
                    type: 'danger',
                    message: 'Otp invalid try again !',

                };

                return res.redirect('/user/forgotPassword');


            }


        } else {

            req.session.message = {
                type: 'danger',
                message: 'Session time out: Try Again !',

            };

            return res.redirect('/user/forgotPassword');


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

        return res.redirect('/');


    }


    try {

        return res.render('users/passwordResetPage.ejs');



    }
    catch (err) {
        next(err);
    }


}

//! res setting password handler 

const resetPasswordHandler = async (req, res, next) => {




    try {

        if (req.session.userID) {

            return res.redirect('/');


        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        const { password } = req.body;




        if (req.session.emailVerifiedForPasswordReset && req.session.passwordResetToken) {

            if (!password) {

                req.session.message = {
                    type: 'danger',
                    message: 'Failed: Enter the password  !',

                };

                return res.redirect('/user/resetPassword');



            } else if (!passwordRegex.test(password)) {

                req.session.message = {
                    type: 'danger',
                    message: 'The password should contain at-least one capital letter one small letter and one symbol(@$!%*?&) and should be eight character long'
                }

                return res.redirect('/user/resetPassword');

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

                        return res.redirect('/user/login');


                    }


                } else {

                    req.session.message = {
                        type: 'danger',
                        message: 'Failed to rest password. Try Again !',

                    };

                    return res.redirect('/user/forgotPassword');


                }

            }

        } else {

            req.session.message = {
                type: 'danger',
                message: 'Session time out: Try Again !',

            };

            return res.redirect('/user/forgotPassword');


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

            return res.redirect('/');

        }

        const userID = req.session.userID;

        let user = await User.findById(userID).lean();

        firstName = user.name.split(' ')[0];

        lastName = user.name.split(' ')[1];

        joined_date = user.joined_date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

        user = { ...user, firstName, lastName, joined_date };







        return res.render('users/myAccount.ejs', { user });

    }
    catch (err) {


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

            return res.redirect('/');

        }


        const userID = req.session.userID;

        let user = await User.findById(userID).lean();

        firstName = user.name.split(' ')[0];

        lastName = user.name.split(' ')[1];

        joined_date = user.joined_date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

        user = { ...user, firstName, lastName, joined_date };

        return res.render('users/editProfile.ejs', { user })

    }
    catch (err) {


        next(err)
    }
}

// ! edit profile handler 

const editProfileHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            return res.status(401).json({ "success": false, "message": "Your session timedOut login to edit profile" })


        }



        const userID = req.session.userID;

        const { firstName, lastName, phone } = req.body;

        const newName = firstName.trim() + " " + lastName.trim();


        let DataForUpdate = {

            $set: {
                name: newName,
                phone,


            }
        };



        let profileImg

        if (req.file) {

            profileImg = req.file.filename;

            DataForUpdate.$set.profileImg = profileImg;
        }





        const updatedUser = await User.findByIdAndUpdate(userID, DataForUpdate);

        if (updatedUser instanceof User) {

            return res.status(201).json({ "success": true, "message": "Your profile is updated !" });


        }

        return res.status(500).json({ "success": false, "message": "Failed to update the Profile Hint: server facing issues !" })

    }
    catch (err) {



        return res.status(500).json({ "success": false, "message": "Failed to update the Profile Hint: server facing issues !" })

    }
}

// ! change password handler 

const changePasswordHandler = async (req, res, next) => {


    try {

        if (!req.session.userID) {

            return res.status(401).json({ "success": false, "message": "Your session timedOut login to edit profile" })


        }

        const userID = req.session.userID;

        const userData = await User.findById(userID);

        const password = userData.password;

        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        const { currentPassword, newPassword } = req.body;

        if (! await bcrypt.compare(currentPassword, password)) {


            return res.status(401).json({ "success": false, "message": "Enter the right current password ! " })



        }


        if (!passwordRegex.test(newPassword)) {

            return res.status(400).json({ "success": false, "message": "The new  password should contain at-least one capital letter one small letter and one symbol from (@, $, !, %, *, ?, or &) and should be eight character long  " });


        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (!hashedPassword) {


            return res.status(500).json({ "success": false, "message": " Failed to change password due to server issues  " });


        }

        const updatedData = await User.findByIdAndUpdate(userID, { $set: { password: hashedPassword } });


        if (updatedData instanceof User) {

            return res.status(201).json({ "success": true, "message": " Your password is changed  !" });



        }


        return res.status(500).json({ "success": false, "message": " Failed to change password due to server issues  " });



    }
    catch (err) {

        return res.status(500).json({ "success": false, "message": "Failed to update the Profile Hint: server facing issues !" })

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
    renderUserProfile,
    renderEditProfilePage,
    editProfileHandler,
    changePasswordHandler,

}