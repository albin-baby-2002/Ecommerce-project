// importing libraries, files and dependencies 

const express = require("express");
const session = require("express-session");
const morgan = require('morgan');

const dotenv = require('dotenv').config();
const mongoose = require("mongoose");

const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

const errorHandler = require('./middleware/errorHandling');







// connecting to mongodb database using mongoose

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('connected to mongodb database')
    })
    .catch((err) => {
        console.log('failed to connect to mongodb database');
        throw new Error(err);
    })


// starting the express server application

const app = express();

// Create a Morgan logger with a specific format
const logger = morgan('combined');

// Use the logger middleware to log requests
app.use(logger);



//initialization of port for listening

const PORT = process.env.PORT || 3000;


// session initialization

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


// using session messages for rendering

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    res.locals.userID = req.session.userID;
    delete req.session.message;
    next();
});


// middleware for request data parsing

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// middleware to check for syntax error causing parsing error

app.use(errorHandler.parsingErrorHandler);


// middleware for serving static files

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

