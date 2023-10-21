
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel')
const path = require('path');
const Order = require('../models/orderModel');
const { log } = require('console');
const fsPromises = require('fs').promises;
const excelJS = require('exceljs');

//!render login page

const renderLoginPage = async (req, res, next) => {

    if (req.session.adminLoggedIn && req.session.admin) {

        res.redirect('/admin/usersList');

        return;

    }

    try {


        res.render('admin/adminLogin.ejs');

        return;

    }
    catch (err) {

        next(err)
    }
}

//!login handler

const loginHandler = async (req, res, next) => {

    try {

        const { email, password } = req.body;

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

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
            res.redirect('/admin');
            return;
        }


        const admin = await mongoose.connection.collection('admins').findOne({ email })

        if (admin) {

            if (await bcrypt.compare(password, admin.password)) {

                req.session.admin = admin._id;
                req.session.adminLoggedIn = true;

                res.redirect('/admin/dashboard');

                return;

            } else {

                req.session.message = {
                    type: 'danger',
                    message: 'Failed to login : wrong password '
                };

                res.redirect('/admin');
                return;

            }


        }
        else {


            req.session.message = {
                type: 'danger',
                message: 'Failed to login : Invalid Email '
            };

            res.redirect('/admin');
            return;
        }

    }
    catch (err) {

        next(err)
    }
}

//!logout handler 

const logoutHandler = async (req, res, next) => {

    try {

        req.session.destroy();

        res.redirect('/admin');

        return;

    }
    catch (err) {
        next(err)
    }

}


//!render user list 


const renderUsersList = async (req, res, next) => {

    try {

        const users = await User.find({});

        res.render('admin/usersList.ejs', { users });

        return;

    }
    catch (err) {

        next(err)
    }
}

//! block user handler

const blockUserHandler = async (req, res, next) => {

    try {

        const { id } = req.body;

        const user = await User.findOne({ _id: id });

        if (user) {
            if (user.blocked) {


                const usersData = await User.findByIdAndUpdate(id, { $set: { blocked: false } });
                if (usersData) {

                    res.status(200).json({ 'success': true });

                    return;
                }
                else {
                    res.status(500).json({ 'success': false });

                    return;
                }

            } else {
                const usersData = await User.findByIdAndUpdate(id, { $set: { blocked: true } });
                if (usersData) {
                    res.status(200).json({ 'success': true });

                    return;
                }
                else {
                    res.status(500).json({ 'success': false });

                    return;
                }
            }
        } else {
            res.status(404).json({ 'success': false });
            return;
        }

    }
    catch (err) {

        next(err)

    }
}


//! Add new category page render


const renderAddCategoryPage = async (req, res, next) => {

    try {

        res.render('admin/addCategory.ejs');

        return;

    }
    catch (err) {

        next(err)
    }
};

//!add category handler 

const addCategoryHandler = async (req, res, next) => {

    try {

        console.log(req.body)

        const { name, description } = req.body;



        if (!name || !description) {

            res.status(400).json({ "success": false, "message": "All fields are mandatory. Try Again !" });

            return;

        }

        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(name, 'i') } });



        if (existingCategory) {

            res.status(409).json({ "success": false, "message": "failed  to add the category already exists!" });
            return;

        } else {

            const newCategory = new Category({ name, description });

            try {

                await newCategory.save();

                res.status(201).json({ "success": true, "message": "New category created successfully !" });

                return;

            }
            catch (err) {

                res.status(500).json({ "success": false, "message": "Failed to add the category try again ! Hint : facing issue while saving data to database" });
                return;

            }


        }

    }
    catch (err) {

        res.status(500).json({ "success": false, "message": "Failed to add the category try again Hint: server side issue!" });
        return;
    }
};

//!add product page render

const renderAddProductPage = async (req, res, next) => {

    try {

        const categories = await Category.find();

        res.render('admin/addProduct.ejs', { categories });

        return;

    }
    catch (err) {

        next(err)
    }
};

//! add product handler

const addProductHandler = async (req, res, next) => {

    try {

        const files = req.files;

        console.log(files);

        const listOfImageNames = Object.entries(files).map((arr) => arr[1][0].filename);

        let { name, groupingID, category, description, price, stock, size, color } = req.body;

        price = Number(price);
        stock = Number(stock);
        groupingID = Number(groupingID);
        size = size.trim();
        color = color.trim();


        if (!name || !category || !description || !price || !groupingID || !size || !color) {

            res.status(400).json({ "success": false, "message": "All fields are mandatory. Try Again !" })

            return;

        } else if (isNaN(groupingID) || groupingID < 1000) {

            res.status(400).json({ "success": false, "message": " Grouping ID should be a  numberical ID greater 1000. Hint: it is id used to group together different color and size variant of a product  !" })

        }
        else if (isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {

            res.status(400).json({ "success": false, "message": " Price and stock value should be non negative numerical values. Try Again !" })

            return;
        }


        const newProduct = new Product({ name, groupingID, price, stock, category, description, images: listOfImageNames, color: color.toLowerCase(), size: size.toLowerCase() });

        try {

            await newProduct.save();

            res.status(201).json({ "success": true, "message": " New product successfully added " })
            return;
        }
        catch (err) {

            console.log(err);

            res.status(500).json({ "success": false, "message": " Failed to add the product. Try again ! Hint: failed saving to database" })
            return;


        }




    }
    catch (err) {

        console.log(err)

        res.status(500).json({ "success": false, "message": " Failed to add the product. Try again ! Hint: server side error" })

    }
};

//! categories list render

const renderCategoriesPage = async (req, res, next) => {

    try {

        const categories = await Category.find();

        res.render('admin/categoriesList.ejs', { categories });

        return;

    }
    catch (err) {

        next(err)
    }
};

//! product list render

const renderProductsPage = async (req, res, next) => {

    try {

        let products = await Product.find().lean();

        // find the list of products first then map all the products so that the category id can be used to find the category name and can be used to replace category id and use Promise.all because it need to await for all products category to be found;

        products = await Promise.all(products.map(async (product) => {

            let category = await Category.findOne({ _id: product.category }, { name: 1, _id: 0 });

            return { ...product, category: category.name }
        }))


        res.render('admin/productsList.ejs', { products })

    }
    catch (err) {

        next(err)
    }
};

//!render edit product page

const renderEditProductPage = async (req, res, next) => {

    try {
        const categories = await Category.find();

        const productId = req.params.productId;

        let productData = await Product.findOne({ _id: productId }).lean();

        let productCategory = await Category.findOne({ _id: productData.category });



        productData = { ...productData, category: productCategory.name }




        res.render('admin/editProduct.ejs', { categories, product: productData });

        return;

    }
    catch (err) {

        next(err)
    }
};


//!edit product handler 


const editProductHandler = async (req, res, next) => {

    try {

        console.log(req.files);

        const files = req.files;

        const infoOfUpdatedImgs = Object.entries(files).map((arr) => {
            return [arr[1][0].fieldname, arr[1][0].filename]
        });

        console.log(infoOfUpdatedImgs);


        let { name, category, price, stock, description, onSale, groupingID, size, color } = req.body;

        groupingID = Number(groupingID)



        const productId = req.params.productId;


        price = Number(price);
        stock = Number(stock);
        onSale = onSale.trim();
        size = size.trim();


        if (!name || !category || !groupingID || !description || !price || !onSale || !size || !color) {

            req.session.message = {
                type: 'danger',
                message: 'All Fields Are Mandatory'
            }

            res.redirect(`/admin/editProduct/${productId}`);
            return;

        } else if (isNaN(groupingID) || groupingID < 1000) {

            res.status(400).json({ "success": false, "message": " Grouping ID should be a  numerical ID greater 1000. Hint: it is id used to group together different color and size variant of a product  !" })

        } else if (Number.isNaN(price) || Number.isNaN(stock) || price < 0 || stock < 0) {
            req.session.message = {
                type: 'danger',
                message: 'Price and Stock should be numerical value'
            }

            res.redirect(`/admin/editProduct/${productId}`);
            return;

        }

        onSale = onSale === 'true' ? true : false;


        const existingProductData = await Product.findById(productId).lean();


        let images = existingProductData.images;

        let oldImages = [];


        infoOfUpdatedImgs.forEach((info) => {

            let matchedImg = images.find((img) => {
                return img.toLowerCase().includes(info[0].toLowerCase())
            })

            if (matchedImg) {

                console.log(" \n matched" + matchedImg);


                for (let i = 0; i < images.length; i++) {

                    if (images[i].toLowerCase() === matchedImg.toLowerCase()) {

                        console.log('ok inside \n \n');

                        oldImages.push(images[i]);

                        images[i] = info[1];
                        break;
                    }
                }

            } else {

                console.log('image match not found');

                req.session.message = {
                    type: 'danger',
                    message: 'failed to update the product'
                }

                res.redirect(`/admin/editProduct/${productId}`);
                return;

            }

        })


        console.log(images);

        console.log(oldImages);





        const updatedProduct = await Product.findByIdAndUpdate(productId, { $set: { name: name, price: price, stock: stock, description: description, category: category, onSale: onSale, images: images, groupingID, size: size.toLowerCase(), color: color.toLowerCase() } })


        if (updatedProduct) {

            req.session.message = {
                type: 'success',
                message: 'product updated successfully'
            }

            res.redirect(`/admin/editProduct/${productId}`);

            oldImages.forEach(async (img) => {

                try {
                    await fsPromises.unlink(path.join(__dirname, '../public/img/productImages', img));

                    console.log('deleted old images ');
                }
                catch (err) {

                    console.log(err);
                    console.log('failed deletion error');


                    return;
                }
            })
            return;

        } else {

            infoOfUpdatedImgs.forEach(async (info) => {

                let imgPath = path.join(__dirname, '../public/img/productImages', info[1]);

                await fsPromises.unlink(imgPath);

                console.log('new images deleted due to failed update');

            })

            req.session.message = {
                type: 'danger',
                message: 'failed to update the product'
            }

            res.redirect(`/admin/editProduct/${productId}`);
            return;
        }






    }
    catch (err) {

        next(err)
    }
};

//! delete product handler

const deleteProductHandler = async (req, res, next) => {

    try {

        const productId = req.params.productId;



        const Deleted = await Product.findByIdAndDelete(productId);

        if (Deleted) {

            const oldImages = Deleted.images;
            console.log(oldImages);

            oldImages.forEach(async (img) => {

                try {
                    await fsPromises.unlink(path.join(__dirname, '../public/img/productImages', img));

                    console.log('deleted old images ');
                }
                catch (err) {

                    console.log(err);
                    console.log('failed deletion error');

                    return;
                }
            })




            res.json({ 'success': true });

            return;

        } else {

            res.json({ 'success': false });
            return;

        }



    }
    catch (err) {

        next(err)
    }
};


//! edit category page render 

const renderEditCategoryPage = async (req, res, next) => {

    try {

        const categoryId = req.params.categoryId;

        let categoryData = await Category.findOne({ _id: categoryId });

        res.render('admin/editCategory.ejs', { category: categoryData });

        return;

    }
    catch (err) {

        next(err)
    }
};

//! edit category handler

const editCategoryHandler = async (req, res, next) => {

    try {

        const categoryId = req.params.categoryId;

        const { name, description } = req.body;

        const updatedCategory = await Category.findByIdAndUpdate(categoryId, { $set: { name: name, description: description } });

        if (updatedCategory) {

            req.session.message = {
                type: 'success',
                message: 'category updated successfully'
            }

            res.redirect(`/admin/editCategory/${categoryId}`)

            return;


        } else {

            req.session.message = {
                type: 'danger',
                message: 'failed to update category'
            }

            res.redirect('/admin/categoryList');
            return;


        }


    }

    catch (err) {

    }



};

//! delete category handler

const deleteCategoryHandler = async (req, res, next) => {

    try {


        const categoryId = new mongoose.Types.ObjectId(req.params.categoryId);

        const isDeleted = await Category.findByIdAndDelete(categoryId);

        if (isDeleted) {

            res.json({ 'success': true });

            return;

        } else {

            res.json({ 'success': false });

            return;

        }

    }
    catch (err) {

        next(err)
    }
};

//! render add Coupon page 

const addCouponPageRender = async (req, res, next) => {

    try {

        res.render('admin/addCouponPage.ejs',);

        return;

    }

    catch (err) {

        next(err)
    }
};


// ! add coupon handler


const addCouponHandler = async (req, res, next) => {

    try {

        let { code, description, rateOfDiscount, maximumDiscount, expirationDate, isActive } = req.body;

        rateOfDiscount = Number(rateOfDiscount);

        maximumDiscount = Number(maximumDiscount);

        expirationDate = new Date(expirationDate);

        code = code.trim().toLowerCase();

        if (!code || !description || !rateOfDiscount || !maximumDiscount || !expirationDate || !isActive) {

            res.status(400).json({ "success": false, "message": "All fields are mandatory. and rate of discount and maximum discount should be above zero Try Again !" })

            return;

        }
        else if (isNaN(rateOfDiscount) || isNaN(maximumDiscount) || rateOfDiscount < 0 || maximumDiscount < 0) {

            res.status(400).json({ "success": false, "message": " Rate of discount and maximum discount value should be non negative numerical values. Try Again !" })

            return;
        }

        isActive = isActive === 'true' ? true : false;

        let coupon = new Coupon({
            code, description, rateOfDiscount, maximumDiscount, isActive, expirationDate
        })

        let savedData = await coupon.save();

        if (savedData instanceof Coupon) {

            res.status(201).json({ "success": true, "message": " new coupon created !" });

            return;
        }


        res.status(500).json({ "success": false, "message": " Failed to add new coupon server facing issues !" })

        return;


    }

    catch (err) {

        console.log(err);

        res.status(500).json({ "success": false, "message": " Failed to add new coupon server facing issues !" })

    }
};

// ! render coupon list page

const renderCouponListPage = async (req, res, next) => {

    try {

        const coupons = await Coupon.find().lean();



        res.render('admin/couponListPage.ejs', { coupons });

        return;

    }

    catch (err) {

        next(err)
    }
};


// !render coupon edit page 

const renderEditCouponPage = async (req, res, next) => {

    try {

        const couponID = new mongoose.Types.ObjectId(req.params.couponID);



        const coupon = await Coupon.findById(couponID);

        console.log(coupon)

        res.render('admin/editCoupon.ejs', { coupon });

        return;

    }

    catch (err) {

        next(err)
    }
};

// ! edit coupon handler 

const editCouponHandler = async (req, res, next) => {

    try {

        const couponID = req.params.couponID;

        console.log(req.body);

        let { code, description, rateOfDiscount, maximumDiscount, expirationDate, isActive } = req.body;

        rateOfDiscount = Number(rateOfDiscount);

        maximumDiscount = Number(maximumDiscount);

        expirationDate = new Date(expirationDate);

        code = code.trim().toLowerCase();

        if (!code || !description || !rateOfDiscount || !maximumDiscount || !expirationDate || !isActive) {

            res.status(400).json({ "success": false, "message": "All fields are mandatory. and rate of discount and maximum discount should be above zero Try Again !" })

            return;

        }
        else if (isNaN(rateOfDiscount) || isNaN(maximumDiscount) || rateOfDiscount <= 0 || maximumDiscount <= 0) {

            res.status(400).json({ "success": false, "message": " Rate of discount and maximum discount value should be non negative numerical values. Try Again !" })

            return;
        }

        isActive = isActive === 'true' ? true : false;


        const updatedCoupon = await Coupon.findByIdAndUpdate(couponID, { code, description, rateOfDiscount, maximumDiscount, isActive, expirationDate });



        if (updatedCoupon instanceof Coupon) {

            res.status(201).json({ "success": true, "message": " coupon updated Successfully !" });

            return;
        }


        res.status(500).json({ "success": false, "message": " Failed to edit coupon server facing issues !" })

        return;


    }

    catch (err) {

        console.log(err);

        res.status(500).json({ "success": false, "message": " Failed to add new coupon server facing issues !" })

        return;

    }
};

// ! render order page 

const renderOrdersPage = async (req, res, next) => {

    try {

        let orders = await Order.aggregate([{
            $lookup: {
                from: 'orderitems',
                localField: 'orderItems',
                foreignField: '_id',
                as: 'orderedItems',
            }
        }, {
            $unwind: '$orderedItems'
        },



        {
            $lookup: {
                from: 'products',
                localField: 'orderedItems.product',
                foreignField: '_id',
                as: 'orderedItems.productInfo'
            }
        }, {
            $group: {
                _id: '$_id',
                userID: { $first: '$userID' },
                paymentMethod: { $first: '$paymentMethod' },
                paymentStatus: { $first: '$paymentStatus' },
                orderStatus: { $first: '$orderStatus' },
                shippingAddress: { $first: '$shippingAddress' },
                grossTotal: { $first: '$grossTotal' },
                couponApplied: { $first: '$couponApplied' },
                discountAmount: { $first: '$discountAmount' },
                finalPrice: { $first: '$finalPrice' },
                clientOrderProcessingCompleted: { $first: '$clientOrderProcessingCompleted' },
                orderDate: { $first: '$orderDate' },
                orderedItems: { $push: '$orderedItems' }
            }
        }]);



        res.render('admin/orderList.ejs', { orders });

        return;

    }

    catch (err) {

        next(err)
    }
};


// ! render order edit page 

const renderOrderEditPage = async (req, res, next) => {

    try {

        const orderID = new mongoose.Types.ObjectId(req.params.orderID);

        let orderData = await Order.aggregate([{
            $match: {
                _id: orderID
            }
        }]).exec();

        console.log(orderData);

        const orderStatusEnum = Order.schema.path('orderStatus').enumValues;

        console.log(orderStatusEnum);

        res.render('admin/modifyOrder.ejs', { orderData, orderStatusEnum })

    }
    catch (err) {

        next(err)

    }
}

// ! modify order status 

const modifyOrderStatusHandler = async (req, res, next) => {

    try {

        const { orderStatus } = req.body;

        console.log(req.body);

        const orderID = req.params.orderID;

        console.log(orderID);

        const updatedOrder = await Order.findByIdAndUpdate(orderID, { $set: { orderStatus: orderStatus } });

        if (updatedOrder instanceof Order) {

            res.status(200).json({ "success": true, "message": 'order status updated' })
        } else {
            res.status(500).json({ "success": false, "message": 'server facing issues try again' })
        }

    }
    catch (err) {
        console.log(err);

        res.status(500).json({ "success": false, "message": 'server facing issues try again' })
    }

}

// ! render admin dashboard

const renderAdminDashboard = async (req, res, next) => {

    try {



        let ProductsCount = await Product.aggregate([

            {

                $match: { onSale: true }

            },

            {
                $group: {
                    _id: null,
                    count: { $sum: 1 }
                }
            }
        ]).exec();

        let ordersData = await Order.aggregate([{


            $match: {

                $and: [


                    {
                        orderStatus: {
                            $nin: ['clientSideProcessing', 'cancelled']
                        }
                    },

                    {
                        paymentStatus: {
                            $nin: ['pending', 'failed', 'refunded', 'cancelled']
                        }
                    },
                    { clientOrderProcessingCompleted: true }]
            },

        }, {

            $group: {
                _id: null,
                count: { $sum: 1 },
                totalRevenue: { $sum: '$finalPrice' }
            }
        }

        ]).exec()



        let totalProducts = ProductsCount[0].count;

        let totalOrders = ordersData[0].count;

        let totalRevenue = ordersData[0].totalRevenue;

        let totalUsers = await User.countDocuments();


        res.render('admin/adminDashboard.ejs', { totalUsers, totalProducts, totalOrders, totalRevenue });

    }
    catch (err) {
        next(err);
    }

}


// ! chart data 

const getChartDataHandler = async (req, res, next) => {



    try {

        const startDate = new Date(new Date().getFullYear(), 0, 1);
        const endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

        let sales = await Order.aggregate([{

            $match: {
                $and: [
                    {
                        orderDate: {
                            $gte: startDate,
                            $lte: endDate
                        },
                        orderStatus: {
                            $nin: ['clientSideProcessing', 'cancelled']
                        }
                    }, {
                        paymentStatus: {
                            $nin: ['pending', 'failed', 'refunded', 'cancelled']
                        }
                    }, { clientOrderProcessingCompleted: true }
                ]
            }
        }, {
            $group: {
                _id: {
                    month: { $month: { $toDate: '$orderDate' } },
                    year: { $year: { $toDate: '$orderDate' } }
                },
                totalSales: { $sum: "$finalPrice" },
                totalOrder: { $sum: 1 }
            }
        }, {
            $sort: { '_id.year': 1, '_id.month': 1 }
        }

        ]).exec();

        let orderType = await Order.aggregate([{

            $match: {
                $and: [
                    {
                        orderDate: {
                            $gte: startDate,
                            $lte: endDate
                        },
                        orderStatus: {
                            $nin: ['clientSideProcessing', 'cancelled']
                        }
                    }, {
                        paymentStatus: {
                            $nin: ['pending', 'failed', 'refunded', 'cancelled']
                        }
                    }, { clientOrderProcessingCompleted: true }
                ]
            }
        }, {
            $group: {
                _id: '$paymentMethod',

                totalOrder: { $sum: 1 }
            }
        },

        ]).exec();

        let categoryBasedOrders = await Order.aggregate([{

            $match: {
                $and: [
                    {
                        orderDate: {
                            $gte: startDate,
                            $lte: endDate
                        },
                        orderStatus: {
                            $nin: ['clientSideProcessing', 'cancelled']
                        }
                    }, {
                        paymentStatus: {
                            $nin: ['pending', 'failed', 'refunded', 'cancelled']
                        }
                    }, { clientOrderProcessingCompleted: true }
                ]
            }
        }, {
            $lookup: {
                from: 'orderitems',
                localField: 'orderItems',
                foreignField: '_id',
                as: 'orderItems',
            }
        }, {
            $unwind: '$orderItems'
        },

        {
            $replaceRoot: {
                newRoot: '$orderItems'
            }
        }, {
            $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'productInfo',
            }

        }, {
            $unwind: '$productInfo'
        }, {
            $replaceRoot: {
                newRoot: '$productInfo'
            }
        }, {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'catInfo',
            }
        }, {
            $addFields: {
                categoryInfo: { $arrayElemAt: ['$catInfo', 0] }
            }
        }, {
            $project: {
                'catInfo': 0
            }
        }, {
            $addFields: {
                catName: "$categoryInfo.name"
            }
        }, {
            $group: {
                _id: '$catName',
                count: { $sum: 1 }
            }
        }

        ]).exec();

        console.log(categoryBasedOrders);




        // console.log(orderType);

        res.status(200).json({ sales, orderType, categoryBasedOrders });

        return;

    }
    catch (err) {
        next(err)
    }
}


// ! render the sales report 


const renderSalesReport = async (req, res, next) => {

    try {

        let startingDate = new Date();
        let endingDate = new Date();

        console.log(req.query.startingDate)


        if (req.query.startingDate) {

            startingDate = new Date(req.query.startingDate);
        }

        if (req.query.endingDate) {

            endingDate = new Date(req.query.endingDate);
        }






        startingDate.setUTCHours(0, 0, 0, 0);

        endingDate.setUTCHours(23, 59, 59, 999);


        console.log(startingDate, endingDate);




        let orders = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: startingDate, $lt: endingDate },

                }
            },

            {
                $match: {
                    orderStatus: {
                        $ne: 'cancelled'
                    }
                }
            }, {
                $lookup: {
                    from: 'orderitems',
                    localField: 'orderItems',
                    foreignField: '_id',
                    as: 'orderedItems',
                }
            }, {
                $unwind: '$orderedItems'
            },



            {
                $lookup: {
                    from: 'products',
                    localField: 'orderedItems.product',
                    foreignField: '_id',
                    as: 'orderedItems.productInfo'
                }
            }, {
                $group: {
                    _id: '$_id',
                    userID: { $first: '$userID' },
                    paymentMethod: { $first: '$paymentMethod' },
                    paymentStatus: { $first: '$paymentStatus' },
                    orderStatus: { $first: '$orderStatus' },
                    shippingAddress: { $first: '$shippingAddress' },
                    grossTotal: { $first: '$grossTotal' },
                    couponApplied: { $first: '$couponApplied' },
                    discountAmount: { $first: '$discountAmount' },
                    finalPrice: { $first: '$finalPrice' },
                    clientOrderProcessingCompleted: { $first: '$clientOrderProcessingCompleted' },
                    orderDate: { $first: '$orderDate' },
                    orderedItems: { $push: '$orderedItems' }
                }
            }]);


        startingDate = startingDate.getFullYear() + '-' + (("0" + (startingDate.getMonth() + 1)).slice(-2)) + '-' + (("0" + startingDate.getUTCDate()).slice(-2));

        console.log(endingDate.getDate());


        endingDate = endingDate.getFullYear() + '-' + (("0" + (endingDate.getMonth() + 1)).slice(-2)) + '-' + (("0" + endingDate.getUTCDate()).slice(-2));



        console.log(startingDate, endingDate);


        res.render('admin/salesReport.ejs', { orders, startingDate, endingDate });

        return;

    }

    catch (err) {

        next(err)
    }
};

// ! sales report in excel

const salesReportInExcel = async (req, res, next) => {

    try {


        let startingDate = new Date();
        let endingDate = new Date();


        if (req.query.startingDate) {

            startingDate = new Date(req.query.startingDate);
        }

        if (req.query.endingDate) {

            endingDate = new Date(req.query.endingDate);
        }






        startingDate.setUTCHours(0, 0, 0, 0);

        endingDate.setUTCHours(23, 59, 59, 999);


        console.log(startingDate, endingDate);




        let orders = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: startingDate, $lt: endingDate },

                }
            },

            {
                $match: {
                    orderStatus: {
                        $ne: 'cancelled'
                    }
                }
            }, {
                $lookup: {
                    from: 'orderitems',
                    localField: 'orderItems',
                    foreignField: '_id',
                    as: 'orderedItems',
                }
            }, {
                $unwind: '$orderedItems'
            },



            {
                $lookup: {
                    from: 'products',
                    localField: 'orderedItems.product',
                    foreignField: '_id',
                    as: 'orderedItems.productInfo'
                }
            },

            {
                $project: {
                    userID: 1,
                    paymentMethod: 1,
                    paymentStatus: 1,
                    orderStatus: 1,
                    shippingAddress: 1,
                    grossTotal: 1,
                    discountAmount: 1,
                    finalPrice: 1,
                    clientOrderProcessingCompleted: 1,
                    orderDate: 1,

                    order: {

                        OrderItemId: '$orderedItems._id',
                        quantity: '$orderedItems.quantity',
                        totalPrice: '$orderedItems.totalPrice',
                        product: {
                            $arrayElemAt: ['$orderedItems.productInfo.name', 0]
                        }
                    }


                }
            },
            {
                $group: {
                    _id: '$_id',
                    userID: { $first: '$userID' },
                    paymentMethod: { $first: '$paymentMethod' },
                    paymentStatus: { $first: '$paymentStatus' },
                    orderStatus: { $first: '$orderStatus' },
                    shippingAddress: { $first: '$shippingAddress' },
                    grossTotal: { $first: '$grossTotal' },
                    couponApplied: { $first: '$couponApplied' },
                    discountAmount: { $first: '$discountAmount' },
                    finalPrice: { $first: '$finalPrice' },
                    clientOrderProcessingCompleted: { $first: '$clientOrderProcessingCompleted' },
                    orderDate: { $first: '$orderDate' },
                    orderedItems: { $push: '$order' }
                }
            }

        ]).exec();

        console.log(orders);

        const workBook = new excelJS.Workbook();
        const worksheet = workBook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'id', key: '_id' },
            { header: 'userID', key: 'userID' },
            { header: 'payment Method', key: 'paymentMethod' },
            { header: 'payment Status', key: 'paymentStatus' },
            { header: 'order Status', key: 'orderStatus' },
            { header: 'shipping Address', key: 'shippingAddress' },
            { header: 'gross Total', key: 'grossTotal' },
            { header: 'coupon Applied', key: 'couponApplied' },
            { header: 'discount Amount', key: 'discountAmount' },
            { header: 'final Price', key: 'finalPrice' },
            { header: 'client OrderProcessing Completed', key: 'clientOrderProcessingCompleted' },
            { header: 'order Date', key: 'orderDate' },
            { header: 'ordered Items', key: 'orderedItems' },
        ];

        orders.forEach((order) => {
            worksheet.addRow(order);

        })

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true }
        })

        res.setHeader("content-Type", "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet");

        res.setHeader("content-Disposition", 'attachment; filename=orders.xlsx');

        return workBook.xlsx.write(res).then(() => {
            res.status(200)
        })

    }
    catch (err) {
        next(err);
    }
}
module.exports = {
    renderLoginPage,
    renderUsersList,
    loginHandler,
    blockUserHandler,
    renderAddCategoryPage,
    addCategoryHandler,
    renderAddProductPage,
    addProductHandler,
    renderCategoriesPage,
    renderProductsPage,
    renderEditProductPage,
    deleteProductHandler,
    editProductHandler,
    editCategoryHandler,
    renderEditCategoryPage,
    deleteCategoryHandler,
    logoutHandler,
    addCouponPageRender,
    addCouponHandler,
    renderCouponListPage,
    renderEditCouponPage,
    editCouponHandler,
    renderOrdersPage,
    renderOrderEditPage,
    modifyOrderStatusHandler,
    renderAdminDashboard,
    getChartDataHandler,
    renderSalesReport,
    salesReportInExcel

}