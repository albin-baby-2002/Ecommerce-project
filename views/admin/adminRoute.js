const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const errorHandler = require('../middleware/errorHandling');
const { upload } = require('../middleware/multerMiddlewares');




router.get('/', adminController.renderLoginPage);

router.post('/login', adminController.loginHandler);

router.get('/logout', adminController.logoutHandler)




router.use((req, res, next) => {

    if (req.session.adminLoggedIn && req.session.admin) {

        next()
        return
    } else {
        res.redirect('/admin')
    }

})


router.get('/usersList', adminController.renderUsersList);

router.get('/categoryList', adminController.renderCategoriesPage);

router.get('/productList', adminController.renderProductsPage);


router.post('/blockUser', adminController.blockUserHandler);


router.route('/addCategory')
    .get(adminController.renderAddCategoryPage)
    .post(adminController.addCategoryHandler);

router.route('/editProduct/:productId')
    .get(adminController.renderEditProductPage)
    .post(adminController.editProductHandler);

router.route('/editCategory/:categoryId')
    .get(adminController.renderEditCategoryPage)
    .post(adminController.editCategoryHandler);

router.route('/deleteCategory/:categoryId')
    .post(adminController.deleteCategoryHandler)



router.route('/deleteProduct/:productId')
    .post(adminController.deleteProductHandler)


router.route('/addProduct')

    .get(adminController.renderAddProductPage)

    .post(upload.fields([{ name: 'mainImg', maxCount: 1 }, { name: 'mainImgThumbnail', maxCount: 1 }, { name: 'secondImg', maxCount: 1 }, { name: 'secondImgThumbnail', maxCount: 1 }, { name: 'thirdImg', maxCount: 1 }, { name: 'thirdImgThumbnail', maxCount: 1 }, { name: 'fourthImg', maxCount: 1 }, { name: 'fourthImgThumbnail', maxCount: 1 }]), errorHandler.multerErrorHandler, adminController.addProductHandler);



//for 404 error

router.use('*', errorHandler.adminPageNotFound);


//for rendering error page for unknown / critical error

router.use(errorHandler.adminErrorHandler);








module.exports = router