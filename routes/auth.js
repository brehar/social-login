'use strict';

var express = require('express');
var router = express.Router();

var request = require('request');
var qs = require('querystring');
var jwt = require('jsonwebtoken');

var User = require('../models/user');

router.post('/github', (req, res) => {
    var accessTokenUrl = 'https://github.com/login/oauth/access_token';
    var userApiUrl = 'https://api.github.com/user';

    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        redirect_uri: req.body.redirectUri,
        client_secret: process.env.GITHUB_SECRET
    };

    request.get({
        url: accessTokenUrl,
        qs: params
    }, (err, response, body) => {
        if (err) return res.status(400).send(err);

        var accessToken = qs.parse(body);
        var headers = { 'User-Agent': 'satellizer' };

        request.get({
            url: userApiUrl,
            qs: accessToken,
            headers: headers,
            json: true
        }, (err, response, profile) => {
            if (err) return res.status(400).send(err);

            User.findOne({github: profile.id}, (err, existingUser) => {
                if (err) return res.status(400).send(err);

                if (existingUser) {
                    var token = existingUser.makeToken();
                    res.cookie('accessToken', token).send({token: token});
                } else {
                    var user = new User();
                    user.github = profile.id;
                    user.username = profile.login;

                    user.save((err, savedUser) => {
                        var token = savedUser.makeToken();
                        res.cookie('accessToken', token).send({token: token});
                    });
                }
            });
        });
    });
});


router.post('/twitter', function(req, res) {
    var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
    var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
    var profileUrl = 'https://api.twitter.com/1.1/users/show.json?screen_name=';

    if (!req.body.oauth_token || !req.body.oauth_verifier) {
        var requestTokenOauth = {
            consumer_key: 'j3vWgNfApdetHuyGseoE8Uu2N',
            consumer_secret: process.env.TWITTER_SECRET,
            callback: req.body.redirectUri
        };

        request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function(err, response, body) {
            var oauthToken = qs.parse(body);

            res.send(oauthToken);
        });
    } else {
        var accessTokenOauth = {
            consumer_key: 'j3vWgNfApdetHuyGseoE8Uu2N',
            consumer_secret: process.env.TWITTER_SECRET,
            token: req.body.oauth_token,
            verifier: req.body.oauth_verifier
        };

        request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, accessToken) {
            accessToken = qs.parse(accessToken);

            var profileOauth = {
                consumer_key: 'j3vWgNfApdetHuyGseoE8Uu2N',
                consumer_secret: process.env.TWITTER_SECRET,
                oauth_token: accessToken.oauth_token
            };

            request.get({
                url: profileUrl + accessToken.screen_name,
                oauth: profileOauth,
                json: true
            }, function(err, response, profile) {
                if (req.header('Authorization')) {
                    User.findOne({ twitter: profile.id }, function(err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Twitter account that belongs to you' });
                        }

                        var token = req.header('Authorization').split(' ')[1];
                        var payload = jwt.decode(token, process.env.JWT_SECRET);

                        User.findById(payload.sub, function(err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }

                            user.twitter = profile.id;
                            user.username = profile.name;
                            user.save(function(err, savedUser) {
                                var token = savedUser.makeToken();
                                res.cookie('accessToken', token).send({token: token});
                            });
                        });
                    });
                } else {
                    User.findOne({ twitter: profile.id }, function(err, existingUser) {
                        if (existingUser) {
                            var token = existingUser.makeToken();
                            return res.cookie('accessToken', token).send({token: token});
                        }

                        var user = new User();
                        user.twitter = profile.id;
                        user.username = profile.name;
                        user.save(function(err, savedUser) {
                            var token = savedUser.makeToken();
                            res.cookie('accessToken', token).send({token: token});
                        });
                    });
                }
            });
        });
    }
});

router.post('/google', function(req, res) {
    var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
    var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: process.env.GOOGLE_SECRET,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
    };

    request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
        var accessToken = token.access_token;
        var headers = { Authorization: 'Bearer ' + accessToken };

        request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
            if (profile.error) {
                return res.status(500).send({message: profile.error.message});
            }

            if (req.header('Authorization')) {
                User.findOne({ google: profile.sub }, function(err, existingUser) {
                    if (existingUser) {
                        return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
                    }

                    var token = req.header('Authorization').split(' ')[1];
                    var payload = jwt.decode(token, process.env.JWT_SECRET);
                    User.findById(payload.sub, function(err, user) {
                        if (!user) {
                            return res.status(400).send({ message: 'User not found' });
                        }
                        user.google = profile.sub;
                        user.username = profile.name;
                        user.save(function() {
                            var token = user.makeToken();
                            res.cookie('accessToken', token).send({token: token});
                        });
                    });
                });
            } else {
                User.findOne({ google: profile.sub }, function(err, existingUser) {
                    if (existingUser) {
                        var token = existingUser.makeToken();
                        res.cookie('accessToken', token).send({token: token});
                    }

                    var user = new User();
                    user.google = profile.sub;
                    user.username = profile.name;
                    user.save(function(err) {
                        var token = user.makeToken();
                        res.cookie('accessToken', token).send({token: token});
                    });
                });
            }
        });
    });
});

module.exports = router;