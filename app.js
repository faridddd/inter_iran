const express = require('express');
const morgan = require('morgan');
const https = require('https')
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const expHbs = require('express-handlebars');
const flash = require('connect-flash')
const session = require('express-session')
const bcrypt = require('bcryptjs');
const passport = require('passport')
const Lstrategy = require('passport-local').Strategy;
const moment = require('moment')
const key = fs.readFileSync('keys/key.pem')
const cert = fs.readFileSync('keys/cert.pem')
const Handlebars = require('handlebars')
const multer = require('multer');
const routes = require("./routes/index");
var upload = multer({
    dest: 'uploads/'
})
const Post = require("./models/Post")
const User = require("./models/User")

const favicon = require('express-favicon');
var options = {
    key: key,
    cert: cert
}

https.createServer(options, app).listen(443)
console.log('server on https://localhost');
// Token

// mongo stuff
const option = {
    useNewUrlParser: true,
};
uri = 'mongodb://localhost/inter_iran'
mongoose.connect(uri, option);
mongoose.connection.on("connected",()=>{
    console.log("connected");
})
mongoose.connection.on("error",(err)=>{
    console.log(err);
})

// middlewares

app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'sadfgrweadscdagedsX'
}))

Handlebars.registerHelper('formatDate', function (date, format) {
    return moment(date).format(format);
})

app.use(passport.initialize())

app.use(passport.session())

app.use(favicon(__dirname + '/favicon.png'));

passport.use(new Lstrategy({
    usernameField: 'email'
}, (email, password, done) => {
    User.findOne({
        email: email
    }, (err, data) => {
        // console.log(data);
        // console.log(err);
        if (!data) {
            return done(null, false, {
                message: 'No user found'
            })
        }
        bcrypt.compare(password, data.password, (err, isMatch) => {
            if (err) {
                console.log(err);
            }
            if (isMatch) {
                return done(null, data)
            } else {
                return done(null, false, {
                    message: 'Password error'
                })
            }
        })
    })
}))

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

app.use(flash())

app.use((req, res, next) => {
    res.locals.Smsg = req.flash('Smsg');
    res.locals.Fmsg = req.flash('Fmsg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next()
})
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())
app.use(morgan('dev'));
app.set('view engine', 'handlebars');
app.engine('hbs', expHbs({
    defaultLayout: 'main',
    extname: 'hbs'
}));
app.use(express.static(__dirname + '/views/public'))

app.use('/',routes);