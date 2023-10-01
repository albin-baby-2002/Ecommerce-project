
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')



//user home render 

router.get('/', (req, res) => {
    res.render('users/home.ejs')
})

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






module.exports = router