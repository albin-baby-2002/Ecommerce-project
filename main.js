// importing libraries, files and dependencies 

const express = require("express");
const session = require("express-session");

const dotenv = require('dotenv').config();
const mongoose = require("mongoose");

const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

const errorHandler = require('./middleware/errorHandling');


// connecting to mongodb database using mongoose

mongoose.connect(`mongodb+srv://albinbtg:${process.env.MONGODB_ATLAS_PASSWORD}@cluster0.9jzlkwx.mongodb.net/ecommerce?retryWrites=true&w=majority`)
    .then(() => {
        console.log('connected to mongodb database')
    })
    .catch((err) => {
        console.log('failed to connect to mongodb database');
        throw new Error(err);
    })


// starting the express server application

const app = express();


//initialization of port for listening

const PORT = process.env.PORT || 3000;


//session initialization

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false
}));


//using session messages for rendering

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    res.locals.userID = req.session.userID;
    delete req.session.message;
    next();
});


//middleware for req data parsing

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError) {
        // Handle JSON parsing errors
        console.error('JSON parsing error:', error);
        res.status(400).json({ error: 'Invalid JSON data' });
    } else {
        next(error);
    }
});


//middleware for serving static files

app.use(express.static('public'));


// middleware for no cache
app.use(function (req, res, next) {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

//setting up view engine-ejs

app.set('view engine', 'ejs');
app.set('views', './views');


//for user routes

app.use('/', userRoute);


//for admin router

app.use('/admin', adminRoute);


// for 404 error admin route

app.use('/admin/*', errorHandler.adminPageNotFound);


//for 404 error except for admin routes

app.use('*', errorHandler.userPageNotFound);


//server listening at port for requests

app.listen(PORT, function () {
    console.log("Server is running at PORT:" + PORT);
});

