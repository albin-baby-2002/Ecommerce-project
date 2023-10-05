const adminLoginValidation = (req, res, next) => {

    if (req.session.adminLoggedIn && req.session.admin) {

        next()
        return
    } else {
        res.redirect('/admin');
        return;
    }

}

module.exports = { adminLoginValidation }