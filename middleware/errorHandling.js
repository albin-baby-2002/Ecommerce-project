const userPageNotFound = (req, res, next) => {

    res.render('users/404.ejs');


}

const userErrorHandler = (err, req, res, next) => {

    console.log(err);

    res.render('users/error.ejs')


}
const adminPageNotFound = (req, res, next) => {

    console.log(err);

    res.render('admin/404.ejs');


}

const adminErrorHandler = (err, req, res, next) => {


    res.render('admin/error.ejs')


}

const multerErrorHandler = (err, req, res, next) => {



    res.status(400).json({ "success": false, "message": "Img uploading Failed : wrong img type , Insert correct Img and try Again!" })

    return;





}


const parsingErrorHandler = (error, req, res, next) => {
    if (error instanceof SyntaxError) {

        res.status(400).json({ error: 'Invalid JSON data' });

    } else {


        next(error);
    }
}

module.exports = { userPageNotFound, userErrorHandler, adminErrorHandler, adminPageNotFound, multerErrorHandler, parsingErrorHandler }