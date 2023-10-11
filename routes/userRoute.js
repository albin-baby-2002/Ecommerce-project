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

// resend otp 

router.route('/user/resendOTP')
    .post(userController.resendOtpHandler);


// email verification page using otp if failed to verify during signUp

router.route('/user/emailVerification')
    .get(userController.verifyEmailHandler)

// render single product details page

router.route('/user/productDetails/:groupingID')
    .get(userController.renderProductDetailsPage)

// user logout 

router.get('/user/logout', userController.logoutHandler);

// render forgot password page

router.route('/user/forgotPassword')
    .get(userController.renderForgotPasswordPage)
    .post(userController.forgotPasswordHandler);

router.route('/user/forgotPassword/verifyOTP')
    .post(userController.forgotPasswordVerifyOtpHandler)


router.route('/user/resetPassword')
    .get(userController.renderResetPasswordPage)
    .post(userController.resetPasswordHandler)

router.route('/user/addToWishList')
    .post(userController.addToWishListHandler)

router.route('/user/addToCart')
    .post(userController.addToCartHandler);

router.route('/user/wishList')
    .get(userController.renderWishListPage)
    .delete(userController.removeFromWishListHandler);

router.route('/user/cart')
    .get(userController.renderCartPage)



//for rendering error page for unknown / critical error

router.use(errorHandler.userErrorHandler);


// exporting the user routes

module.exports = router