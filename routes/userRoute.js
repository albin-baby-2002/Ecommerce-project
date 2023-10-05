// importing necessary libraries and dependencies

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const errorHandler = require('../middleware/errorHandling');


//user home render 

router.get('/', userController.renderHomePage);


//signUp render and validation

router.route('/user/signUp')
    .get(userController.renderSignUpPage)
    .post(userController.signUpHandler);


//login render and validation

router.route('/user/login')
    .get(userController.renderLoginPage)
    .post(userController.loginHandler);


//otp verification render and validation

router.route('/user/verifyOTP')
    .get(userController.renderOtpVerificationPage)
    .post(userController.otpVerificationHandler);


// email verification page using otp if failed to verify during signUp

router.route('/user/emailVerification')
    .get(userController.verifyEmailHandler)

// render single product details page

router.route('/user/productDetails/:productId')
    .get(userController.renderProductDetailsPage)

// user logout 

router.get('/user/logout', userController.logoutHandler);





//for rendering error page for unknown / critical error

router.use(errorHandler.userErrorHandler);


// exporting the user routes

module.exports = router