// ! importing necessary libraries and dependencies

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const errorHandler = require('../middleware/errorHandling');
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController');
const checkoutController = require('../controllers/checkoutController');
const { upload } = require('../middleware/multerMiddlewareForProfile');



// ! user home page render 

router.get('/', productController.renderHomePage);

// ! search page render 

router.get('/search', productController.renderSearchAndBuy);

// ! render single product details page

router.route('/user/productDetails/:groupingID')
    .get(productController.renderProductDetailsPage)






// ! signUp render and validation

router.route('/user/signUp')
    .get(userController.renderSignUpPage)
    .post(userController.signUpHandler);


// ! login render and validation

router.route('/user/login')
    .get(userController.renderLoginPage)
    .post(userController.loginHandler);

// ! user logout 

router.get('/user/logout', userController.logoutHandler);


// ! otp verification render and validation

router.route('/user/verifyOTP')
    .get(userController.renderOtpVerificationPage)
    .post(userController.otpVerificationHandler);


// ! resend otp 

router.route('/user/resendOTP')
    .get(userController.resendOtpHandler);


// ! email verification page using otp if failed to verify during signUp

router.route('/user/emailVerification')
    .get(userController.verifyEmailHandler)







// ! render forgot password page and handling forgot password req

router.route('/user/forgotPassword')
    .get(userController.renderForgotPasswordPage)
    .post(userController.forgotPasswordHandler);


// ! verify otp for redirecting user to reset password page 

router.route('/user/forgotPassword/verifyOTP')
    .get(userController.renderForgotPasswordVerifyOtpPage)
    .post(userController.forgotPasswordVerifyOtpHandler)


// ! render reset password page and handle password reset

router.route('/user/resetPassword')
    .get(userController.renderResetPasswordPage)
    .post(userController.resetPasswordHandler)






// ! add to wishlist handler 

router.route('/user/addToWishList')
    .post(productController.addToWishListHandler)


// ! render wishlist page and remove from wishlist handler  

router.route('/user/wishList')
    .get(productController.renderWishListPage)
    .delete(productController.removeFromWishListHandler);


// ! add to cart handler     

router.route('/user/addToCart')
    .post(cartController.addToCartHandler);


// ! render cart page and delete and reduce from cart handler

router.route('/user/cart')
    .get(cartController.renderCartPage)
    .delete(cartController.deleteItemFromCartHandler)
    .patch(cartController.reduceCartItemQuantityHandler);

// ! get total price of cart items 

router.get('/user/cartTotal', cartController.getTotalCartPrice);





// ! render checkout page 

router.get('/user/checkout', productController.renderCheckOutPage);

// ! add new delivery address handler

router.post('/user/addNewAddress', userController.addNewDeliveryAddress);




// ! render user profile page

router.get('/user/profile', userController.renderUserProfile);

// ! render edit profile page and edit profile handler

router.route('/user/profile/edit')
    .get(userController.renderEditProfilePage)
    .post(upload.single('profileImg'), errorHandler.multerErrorHandler, userController.editProfileHandler);

// ! change password handler 

router.patch('/user/password/change', userController.changePasswordHandler);





// ! verify coupon handler 

router.post('/user/coupon/verify', checkoutController.couponVerificationHandler)

// ! order processing - add address and coupon

router.post('/user/checkout/addressCouponAndItems', checkoutController.addressCouponAndItemsInputHandler)

// ! order processing - render payment page

router.get('/user/paymentPage/:orderID', checkoutController.renderPaymentPage)

// ! order placement handler - cod

router.post('/user/placeOrder/cod', checkoutController.placeCodOrderHandler)

// ! orders page render 

router.get('/user/orders', userController.orderPageRender);

// ! cancel a order 

router.delete('/user/order/cancel/:orderID', userController.cancelOrderHandler);

// ! route to create the razor Pay order 

router.post('/user/razorPay/createOrder/:orderID', userController.razorPayCreateOrder);

// ! payment success req from client 

router.post('/user/razorPay/payment-success', userController.paymentSuccessHandler)

// ! order Details page render 

router.get('/user/orderDetails/:orderID', userController.renderOrderDetails)

// ! invoice page render 

router.get('/user/invoice/:orderID', userController.renderInvoicePage)

// !download invoice 

router.get('/user/invoice/download/:orderID', userController.downloadInvoice)

// ! for rendering error page for unknown / critical error

router.use(errorHandler.userErrorHandler);


// ! exporting the user routes

module.exports = router