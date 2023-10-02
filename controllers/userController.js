const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/userModel');
const OtpData = require('../models/otpDataModel');

const userVerificationHelper = require('../helpers/userVerificationHelpers')




// signup page render 

const renderSignUpPage = (req, res, next) => {

    try {
        res.render('users/signUp.ejs')
    }
    catch (err) {
        next(err);
    }


}

// signup validation 

const signUpHandler = async (req, res, next) => {


    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)?$/;

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    try {

        const { name, email, password, phone } = req.body;

        // validating input data

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

        // redirecting with error if data validation failed 

        if (req.session.message && req.session.message.type === 'danger') {
            res.redirect('/user/signUp');
            return;
        }

        //checking if email is already registered

        const existingUser = await User.findOne({ email });

        console.log(existingUser);

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
                        res.redirect('/user/verifyOTP')
                    }
                })

                .catch((err) => {


                    req.session.message = {
                        type: 'danger',
                        message: 'Sorry: Your Registration Failed ! Try again'
                    };

                    res.redirect('/user/signUp.ejs');
                })


        }

    }
    catch (err) {
        console.log(err)
        next(err)
    }
}



//otp verification page render 


const renderOtpVerificationPage = async (req, res, next) => {

    try {

        res.render('users/verifyOtpPage.ejs')

    }

    catch (err) {
        next(err);
    }
}

//otp verification handler

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

                        res.redirect('/user/login')
                    }
                }
                else {

                    req.session.message = {
                        type: 'danger',
                        message: 'otp verification failed enter the right otp'
                    }

                    res.redirect('/user/verifyOTP')



                }

            } else {

                req.session.message = {
                    type: 'danger',
                    message: 'otp got expired try again '
                }

                res.redirect('/user/verifyOTP')

            }



        } else {

            req.session.message = {
                type: 'danger',
                message: 'session time out : otp verification failed signUp again'
            }

            res.redirect('/user/verifyOTP')
        }



    }

    catch (err) {
        next(err);
    }
}


//login page render

const renderLoginPage = (req, res, next) => {

    try {
        res.render('users/login.ejs')
    }
    catch (err) {
        next(err);
    }


};

//login handler 


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

                    req.session.message = {
                        type: 'success',
                        message: ' You have successfully logged in '
                    }

                    res.redirect('/');

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


const verifyEmailHandler = async (req, res, next) => {

    const existingOtpData = await OtpData.findOne({ userId: req.session.verificationToken });


    if (existingOtpData) {

        const deletedOldOtpData = await OtpData.deleteOne({ userId: req.session.verificationToken });

        console.log(deletedOldOtpData)

    }
}


module.exports = {
    renderLoginPage,
    renderSignUpPage,
    signUpHandler,
    renderOtpVerificationPage,
    otpVerificationHandler,
    loginHandler,
    verifyEmailHandler
}