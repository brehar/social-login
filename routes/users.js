'use strict';

var express = require('express');
var router = express.Router();

var User = require('../models/user');

router.get('/', (req, res) => {
    User.find({}, (err, users) => {
        res.status(err ? 400 : 200).send(err || users);
    }).select('-password');
});

router.get('/userById/:id', (req, res) => {
    User.findById(req.params.id, (err, user) => {
        res.status(err ? 400 : 200).send(err || user);
    });
});

router.get('/availableFriends/:username/:id', (req, res) => {
    User.find({$and: [{username: {$ne: req.params.username}}, {invites: {$nin: [req.params.id]}}, {friends: {$nin: [req.params.id]}}]}, (err, users) => {
        res.status(err ? 400 : 200).send(err || users);
    }).select('-password');
});

router.put('/:user1/invites/:user2', (req, res) => {
    User.findById(req.params.user1, (err, user) => {
        user.invites.push(req.params.user2);
        
        user.save((err, savedUser) => {
            res.send(savedUser);
        });
    });
});

router.delete('/:user1/rejects/:user2', (req, res) => {
    User.findById(req.params.user2, (err, user) => {
        var index = user.invites.indexOf(req.params.user1);
        user.invites.splice(index, 1);

        user.save((err, savedUser) => {
            res.send(savedUser);
        });
    });
});

router.put('/:user1/accepts/:user2', (req, res) => {
    User.findById(req.params.user1, (err, user) => {
        user.friends.push(req.params.user2);

        user.save((err, savedUser) => {
            res.send(savedUser);
        });
    });
});

router.post('/', (req, res) => {
    User.register(req.body, err => {
        res.status(err ? 400 : 200).send(err);
    });
});

router.post('/login', (req, res) => {
    User.login(req.body, (err, token) => {
        if (err) return res.status(400).send(err);
        
        res.cookie('accessToken', token).send(token);
    });
});

router.delete('/logout', (req, res) => {
    res.clearCookie('accessToken').send();
});

router.get('/profile', User.isLoggedIn, (req, res) => {
    res.send(req.user);
});

router.get('/profile/:id', (req, res) => {
    User.findById(req.params.id, (err, profile) => {
        res.status(err ? 400 : 200).send(err || profile);
    }).select('-password');
});

router.put('/profile', User.isLoggedIn, (req, res) => {
    User.findByIdAndUpdate(req.user, {$set: req.body}, {new: true}, (err, profile) => {
        res.status(err ? 400 : 200).send(err || profile);
    });
});

module.exports = router;