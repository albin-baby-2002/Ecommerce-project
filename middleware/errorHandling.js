const userPageNotFound = (req, res, next) => {
    res.render('users/404.ejs');


}

const userErrorHandler = (err, req, res, next) => {

    console.log(err)

    res.render('users/error.ejs')


}
const adminPageNotFound = (req, res, next) => {
    res.render('admin/404.ejs');


}

const adminErrorHandler = (err, req, res, next) => {

    console.log(err)

    res.render('admin/error.ejs')


}

const multerErrorHandler = (err, req, res, next) => {
    console.log(err)

    req.session.message = {
        type: 'danger',
        message: ' failed to add image wrong file type '
    }

    res.redirect('/admin/addProduct');
    return;





}

module.exports = { userPageNotFound, userErrorHandler, adminErrorHandler, adminPageNotFound, multerErrorHandler }