// ! importing necessary libraries and dependencies

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const errorHandler = require('../middleware/errorHandling');
const { upload } = require('../middleware/multerMiddlewares');
const { adminLoginValidation } = require('../middleware/loginValidation')


// ! login page render 

router.get('/', adminController.renderLoginPage);

// ! login request handler

router.post('/login', adminController.loginHandler);

// ! logout request handler

router.get('/logout', adminController.logoutHandler);




// ! render sales report page for pdf download

router.get('/salesReport/pdfRender', adminController.renderSalesReportPdfPage);

// ! middleware for validating admin login 

router.use(adminLoginValidation);




// ! render user list page

router.get('/usersList', adminController.renderUsersList);

// ! render category list page

router.get('/categoryList', adminController.renderCategoriesPage);

// ! render product list page

router.get('/productList', adminController.renderProductsPage);

// ! block user request handler

router.post('/blockUser', adminController.blockUserHandler);

// ! add category route handler 

router.route('/addCategory')
    .get(adminController.renderAddCategoryPage)
    .post(adminController.addCategoryHandler);

// ! edit category route handler

router.route('/editCategory/:categoryId')
    .get(adminController.renderEditCategoryPage)
    .post(adminController.editCategoryHandler);

// ! delete category request handler

router.route('/deleteCategory/:categoryId')
    .post(adminController.deleteCategoryHandler)

// ! edit product route handler 

router.route('/editProduct/:productId')
    .get(adminController.renderEditProductPage)
    .post(upload.fields([{ name: 'mainImg', maxCount: 1 }, { name: 'mainImgThumbnail', maxCount: 1 }, { name: 'secondImg', maxCount: 1 }, { name: 'secondImgThumbnail', maxCount: 1 }, { name: 'thirdImg', maxCount: 1 }, { name: 'thirdImgThumbnail', maxCount: 1 }]), errorHandler.multerErrorHandler, adminController.editProductHandler);

// ! delete product request handler

router.route('/deleteProduct/:productId')
    .post(adminController.deleteProductHandler)

// ! add product route handler

router.route('/addProduct')
    .get(adminController.renderAddProductPage)

    .post(upload.fields([{ name: 'mainImg', maxCount: 1 }, { name: 'mainImgThumbnail', maxCount: 1 }, { name: 'secondImg', maxCount: 1 }, { name: 'secondImgThumbnail', maxCount: 1 }, { name: 'thirdImg', maxCount: 1 }, { name: 'thirdImgThumbnail', maxCount: 1 }]), errorHandler.multerErrorHandler, adminController.addProductHandler);


// ! render the add coupon page

router.route('/addCoupon')
    .get(adminController.addCouponPageRender)
    .post(adminController.addCouponHandler)

// ! render coupon list page 


router.get('/couponList', adminController.renderCouponListPage)

// ! render edit coupon page 

router.route('/editCoupon/:couponID')
    .get(adminController.renderEditCouponPage)
    .put(adminController.editCouponHandler);

// ! render order page 

router.route('/orders')
    .get(adminController.renderOrdersPage)


// ! change order status or cancel order 

router.route('/order/changeStatus/:orderID')
    .get(adminController.renderOrderEditPage)
    .put(adminController.modifyOrderStatusHandler)

// ! admin dashboard render

router.route('/dashboard')
    .get(adminController.renderAdminDashboard)

// ! chart data handler

router.route('/chart')
    .get(adminController.getChartDataHandler)


// ! render sales report 

router.get('/salesReport', adminController.renderSalesReport)

// ! excel sales report
router.get('/salesReport/excel', adminController.salesReportInExcel)

// ! sales report PDF download 

router.get('/salesReport/pdf/download', adminController.salesReportInPdf);

// ! products offer page render and add or modify product offer

router.route('/productsOffers')
    .get(adminController.renderProductOffersPage);

// ! category offer page render and add or modify product offer

router.route('/categoryOffers')
    .get(adminController.renderCategoryOffersPage);

// ! add or modify product offer

router.post('/productsOffers/:productID', adminController.addOrModifyProductOffer)

// ! activate product offer 

router.post('/productsOffer/activate', adminController.activateProductOffer)

// ! deactivate product offer 

router.post('/productsOffer/deactivate', adminController.deactivateProductOffer)



// ! activate category offer 

router.post('/categoryOffer/activate', adminController.activateCategoryOffer)

// ! deactivate category offer 

router.post('/categoryOffer/deactivate', adminController.deactivateCategoryOffer)

// ! for rendering error page for unknown / critical error

router.use(errorHandler.adminErrorHandler);

// ! exporting admin routes 

module.exports = router