'use strict';

var app = angular.module('profileApp', ['ui.router', 'satellizer']);

app.config(function($stateProvider, $urlRouterProvider, $authProvider) {
    $authProvider.github({
        clientId: 'a0a7bd6211c01485b928'
    });

    $authProvider.google({
        clientId: '1098254621315-9h3b8lijqam3vabk0bq5o90un2fdd6hb.apps.googleusercontent.com'
    });

    $stateProvider.state('home', {
        url: '/',
        templateUrl: '/html/home.html',
        controller: 'homeCtrl'
    }).state('register', {
        url: '/register',
        templateUrl: '/html/register.html',
        controller: 'registerCtrl'
    }).state('profile', {
        url: '/profile',
        templateUrl: '/html/profile.html',
        controller: 'profileCtrl',
        resolve: {
            profile: function(Auth, $q, $state) {
                return Auth.getProfile().catch(() => {
                    $state.go('home');
                    return $q.reject();
                });
            }
        }
    }).state('login', {
        url: '/login',
        templateUrl: '/html/login.html',
        controller: 'loginCtrl'
    }).state('logout', {
        url: '/logout',
        templateUrl: '/html/logout.html',
        controller: 'logoutCtrl'
    }).state('details', {
        url: '/profile/:id',
        templateUrl: '/html/details.html',
        controller: 'detailsCtrl',
        resolve: {
            profile: function (Auth, $q, $state) {
                return Auth.getProfile().catch(() => {
                    $state.go('home');
                    return $q.reject();
                });
            }
        }
    }).state('friends', {
        url: '/friends',
        templateUrl: '/html/friends.html',
        controller: 'friendsCtrl',
        resolve: {
            friends: function (Auth, $q, $state) {
                return Auth.getProfile().catch(() => {
                    $state.go('home');
                    return $q.reject();
                });
            }
        }
    });
    
    $urlRouterProvider.otherwise('/');
});