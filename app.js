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
var upload = multer({
    dest: 'uploads/'
})
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
mongoose.connect(uri, option, () => {
    console.log('connected to DB');

});

mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        required: true,
        type: String
    },
    email: {
        type: String,
        required: true
    }
})
const User = mongoose.model('users', UserSchema);

const PostSchema = new Schema({
    title: {
        required: true,
        type: String
    },
    image: {
        type: String
    },
    matn: {
        required: true,
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    comments: [{
        commentBody: {
            type: String,
            required: true
        },
        commentDate: {
            type: Date,
            default: Date.now
        },
        commentUser: {
            type: String
        }

    }]
})
const Post = mongoose.model('posts', PostSchema);
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


// routes

app.get('/', (req, res) => {
    Post.find()
        .then(data => {
            res.render('main/index.hbs', {
                data: data
            })
        })
})

app.get('/signup', (req, res) => {
    res.render('main/signup.hbs')
})
app.post('/signup', (req, res) => {
    User.findOne({
            email: req.body.email
        })
        .then(data => {
            if (data == null) {
                bcrypt.genSalt(16, (err, salt) => {
                    if (err) {
                        throw err;
                    }
                    bcrypt.hash(req.body.password, salt, (error, hash) => {
                        if (error) {
                            throw error
                        }
                        newUser = new User({
                            email: req.body.email,
                            password: hash,
                            username: req.body.username
                        })
                        newUser.save()
                            .then(user => {
                                req.flash('Smsg', 'Account created successfully')
                                res.redirect('/login')
                            })
                    })
                })
            } else {
                req.flash('Fmsg', 'Account exists')
                res.redirect('/signup')
            }
        })
})

app.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
        successFlash: true
    })(req, res, next)
})
app.get('/login', (req, res) => {
    res.render('main/login.hbs')
})

app.post('/addnewpost', (req, res) => {
    if (req.user) {

        const newPost = new Post({
            title: req.body.title,
            image: req.body.image,
            matn: req.body.matn
        })
        newPost.save()
            .then(data => {
                res.redirect('/')
            })
    }
    else {
        req.flash('Fmsg','you\'re not autherizede !')
        res.redirect('/login')
    }
})

app.get('/addnewpost', (req, res) => {
    res.render('main/addnewpost.hbs')
})
app.get('/:id', (req, res) => {
    var id = req.params.id
    Post.findById({
            _id: id
        })
        .then(data => {
            res.render('main/show.hbs', {
                data: data
            })
        })

})

app.post('/posts/comment/:id', (req, res) => {
    // console.log(req.user.username);
    if (req.user) {

        Post.findById({
                _id: req.params.id
            })
            .then(data => {
                const newComment = {
                    commentBody: req.body.cmbody,
                    commentUser: req.user.username
                }
                data.comments.unshift(newComment)

                data.save()
                    .then(data => {
                        res.redirect('/:id')
                    })
            })
    } else {
        req.flash('Fmsg', 'you are not logged in')
        res.redirect('/login')
    }

})

app.post('/search', (req, res) => {
    Post.find({
            title: req.body.title
        })
        .then(data => {
            res.render('main/show.hbs', {
                data: data
            })
        })
})

app.post('/delete', (req, res) => {
    if (req.body.token == token) {
        Post.findByIdAndRemove({
                _id: req.body.id
            })
            .then(data => {
                req.flash('Smsg', 'Post deleted')
                res.redirect('/')
            })
    } else {
        req.flash('Fmsg', 'authentication error')
        res.redirect('/')
    }
})

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /");
})