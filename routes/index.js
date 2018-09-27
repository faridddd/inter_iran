const express = require('express');
const router = express.Router();
const Post = require("../models/Post")
const User = require("../models/User")
const mongoose = require('mongoose');
const passport = require("passport")

router.get('/', (req, res) => {
    Post.find().sort([['date', -1]])
        .then(data => {
            
            res.render('main/index.hbs', {
                data: data 
            })
        })
})

router.get('/signup', (req, res) => {
    res.render('main/signup.hbs')
})

router.post('/signup', (req, res) => {
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

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
        successFlash: true
    })(req, res, next)
})
router.get('/login', (req, res) => {
    res.render('main/login.hbs')
})

router.post('/addnewpost', (req, res) => {
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
    } else {
        req.flash('Fmsg', 'you\'re not autherizede !')
        res.redirect('/login')
    }
})

router.get('/addnewpost', (req, res) => {
    res.render('main/addnewpost.hbs')
})
router.get('/:id', (req, res) => {
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

router.post('/posts/comment/:id', (req, res) => {
    let id = req.params.id
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
                        res.redirect('/'+id)
                    })
            })
    } else {
        req.flash('Fmsg', 'you are not logged in')
        res.redirect('/login')
    }

})

router.post('/search', (req, res) => {
    Post.find({
            title: req.body.title
        })
        .then(data => {
            res.render('main/show.hbs', {
                data: data
            })
        })
})

router.post('/delete', (req, res) => {
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

router.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /");
})

module.exports = router;