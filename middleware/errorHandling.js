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

    res.status(400).json({ "success": false, "message": "Img uploading Failed : wrong img type , Insert correct Img and try Again!" })

    return;





}

module.exports = { userPageNotFound, userErrorHandler, adminErrorHandler, adminPageNotFound, multerErrorHandler }