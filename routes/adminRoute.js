// importing necessary libraries and dependencies

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const errorHandler = require('../middleware/errorHandling');
const { upload } = require('../middleware/multerMiddlewares');
const { adminLoginValidation } = require('../middleware/loginValidation')


// login page render 

router.get('/', adminController.renderLoginPage);

// login request handler

router.post('/login', adminController.loginHandler);

// logout request handler

router.get('/logout', adminController.logoutHandler)

// middleware for validating admin login 

router.use(adminLoginValidation)

// render user list page

router.get('/usersList', adminController.renderUsersList);

// render category list page

router.get('/categoryList', adminController.renderCategoriesPage);

// render product list page

router.get('/productList', adminController.renderProductsPage);

// block user request handler

router.post('/blockUser', adminController.blockUserHandler);

// add category route handler 

router.route('/addCategory')
    .get(adminController.renderAddCategoryPage)
    .post(adminController.addCategoryHandler);

// edit category route handler

router.route('/editCategory/:categoryId')
    .get(adminController.renderEditCategoryPage)
    .post(adminController.editCategoryHandler);

// delete category request handler

router.route('/deleteCategory/:categoryId')
    .post(adminController.deleteCategoryHandler)

// edit product route handler 

router.route('/editProduct/:productId')
    .get(adminController.renderEditProductPage)
    .post(adminController.editProductHandler);

// delete product request handler

router.route('/deleteProduct/:productId')
    .post(adminController.deleteProductHandler)

// add product route handler

router.route('/addProduct')
    .get(adminController.renderAddProductPage)

    .post(upload.fields([{ name: 'mainImg', maxCount: 1 }, { name: 'mainImgThumbnail', maxCount: 1 }, { name: 'secondImg', maxCount: 1 }, { name: 'secondImgThumbnail', maxCount: 1 }, { name: 'thirdImg', maxCount: 1 }, { name: 'thirdImgThumbnail', maxCount: 1 }, { name: 'fourthImg', maxCount: 1 }, { name: 'fourthImgThumbnail', maxCount: 1 }]), errorHandler.multerErrorHandler, adminController.addProductHandler);



//for rendering error page for unknown / critical error

router.use(errorHandler.adminErrorHandler);

// exporting admin routes 

module.exports = router