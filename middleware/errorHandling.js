const notFound = (req, res, next) => {
    res.render('404.ejs');


}

const errorHandler = (err, req, res, next) => {

    console.log(err)

    res.render('error.ejs')


}

module.exports = { notFound, errorHandler }