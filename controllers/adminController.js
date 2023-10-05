
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

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

                res.redirect('/admin/addProduct');

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



        const { name, description } = req.body;

        if (!name || !description) {
            req.session.message = {
                type: 'danger',
                message: 'All Fields Are Mandatory'
            }

            res.redirect('/admin/addCategory');
            return;

        }

        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(name, 'i') } });



        if (existingCategory) {

            req.session.message = {
                type: 'danger',
                message: 'The category already exist'
            }

            res.redirect('/admin/addCategory');
            return;

        } else {

            const newCategory = new Category({ name, description });

            try {

                await newCategory.save();

                req.session.message = {
                    type: 'success',
                    message: ' Success: category added '
                }

                res.redirect('/admin/addCategory');
                return;

            }
            catch (err) {
                req.session.message = {
                    type: 'danger',
                    message: 'Failed to Add Category ! Try again '
                }

                res.redirect('/admin/addCategory');
                return;
            }


        }

    }
    catch (err) {

        next(err)
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

        const listOfImageNames = Object.entries(files).map((arr) => arr[1][0].filename);

        let { name, category, description, price, stock } = req.body;

        price = Number(price);
        stock = Number(stock);


        if (!name || !category || !description || !price || !stock) {

            req.session.message = {
                type: 'danger',
                message: 'All Fields Are Mandatory'
            }

            res.redirect('/admin/addProduct');
            return;

        } else if (stock === NaN || price === NaN) {
            req.session.message = {
                type: 'danger',
                message: 'Price and Stock should be numerical value'
            }

            res.redirect('/admin/addProduct');
            return;

        }

        const newProduct = new Product({ name, price, stock, category, description, images: listOfImageNames });

        try {

            await newProduct.save();
            req.session.message = {
                type: 'success',
                message: 'product added successfully'
            }

            res.redirect('/admin/addProduct');
            return;
        }
        catch (err) {

            console.log(err);
            req.session.message = {
                type: 'danger',
                message: 'failed to add the product try again'
            }

            res.redirect('/admin/addProduct');
            return;


        }




    }
    catch (err) {

        next(err)
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

        console.log(req.body);


        let { name, category, price, stock, description, onSale } = req.body;



        const productId = req.params.productId;


        price = Number(price);
        stock = Number(stock);


        if (!name || !category || !description || !price || !stock || !onSale) {

            req.session.message = {
                type: 'danger',
                message: 'All Fields Are Mandatory'
            }

            res.redirect(`/admin/editProduct/${productId}`);
            return;

        } else if (Number.isNaN(price) || Number.isNaN(stock)) {
            req.session.message = {
                type: 'danger',
                message: 'Price and Stock should be numerical value'
            }

            res.redirect(`/admin/editProduct/${productId}`);
            return;

        }

        onSale = onSale === 'true' ? true : false;



        const updatedProduct = await Product.findByIdAndUpdate(productId, { $set: { name: name, price: price, stock: stock, description: description, category: category, onSale: onSale } })


        if (updatedProduct) {

            req.session.message = {
                type: 'success',
                message: 'product updated successfully'
            }

            res.redirect(`/admin/editProduct/${productId}`);
            return;

        } else {
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

        const isDeleted = await Product.findByIdAndDelete(productId);

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

        const categoryId = req.params.categoryId;

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
    logoutHandler
}