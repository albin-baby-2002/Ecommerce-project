// ! importing necessary libraries and files

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/userModel');
const OtpData = require('../models/otpDataModel');

const userVerificationHelper = require('../helpers/userVerificationHelpers')



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

        const user = await User.findOne({ _id: req.session.passwordResetToken });




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
    renderForgotPasswordVerifyOtpPage
}