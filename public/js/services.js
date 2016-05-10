'use strict';

var app = angular.module('profileApp');

app.service('Auth', function($http) {
    this.getProfile = () => {
        return $http.get('/api/users/profile');
    };
    
    this.registerUser = newUser => {
        return $http.post('/api/users', newUser);
    };
    
    this.login = user => {
        return $http.post('/api/users/login', user);
    };
    
    this.logout = () => {
        return $http.delete('/api/users/logout');
    };
    
    this.saveProfile = newProfile => {
        return $http.put('/api/users/profile', newProfile);
    };

    this.getAllProfiles = () => {
        return $http.get('/api/users');
    };

    this.getSingleProfile = id => {
        return $http.get(`/api/users/profile/${id}`);
    };
});

app.service('Friends', function($http) {
    this.getAvailableFriends = (username, id) => {
        return $http.get(`/api/users/availableFriends/${username}/${id}`);
    };
    
    this.sendInvite = (user1, user2) => {
        return $http.put(`/api/users/${user1}/invites/${user2}`);
    };
    
    this.getUserById = id => {
        return $http.get(`/api/users/userById/${id}`);
    };

    this.rejectRequest = (user1, user2) => {
        return $http.delete(`/api/users/${user1}/rejects/${user2}`);
    };
    
    this.acceptRequest = (user1, user2) => {
        return $http.put(`/api/users/${user1}/accepts/${user2}`);
    };
});