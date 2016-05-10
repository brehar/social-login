'use strict';

var app = angular.module('profileApp');

app.controller('homeCtrl', function($scope, Auth, Friends, $auth) {
    $scope.pendingRequests = [];

    Auth.getProfile().then(res => {
        $scope.currentUser = res.data;

        Auth.getAllProfiles().then(res => {
            $scope.users = res.data;

            for (var i = 0; i < res.data.length; i++) {
                if (res.data[i].invites.indexOf($scope.currentUser._id) !== -1) {
                    $scope.pendingRequests.push(res.data[i]);
                }
            }
        });
    }).catch(err => {
        $scope.currentUser = null;
    });
});

app.controller('registerCtrl', function($scope, $state, Auth, $auth) {
    Auth.getProfile().then(res => {
        $scope.currentUser = res.data;
    }).catch(err => {
        $scope.currentUser = null;
    });

    $scope.authenticate = provider => {
        $auth.authenticate(provider).then(res => {
            $state.go('profile');
        });
    };
    
    $scope.registerUser = function() {
        Auth.registerUser($scope.newUser).then(res => {
            return Auth.login($scope.newUser);
        }).then(res => {
            $state.go('profile');
        });
    };
});

app.controller('profileCtrl', function($scope, Auth) {
    $scope.pendingRequests = [];

    Auth.getProfile().then(res => {
        $scope.currentUser = res.data;

        Auth.getAllProfiles().then(res => {
            for (var i = 0; i < res.data.length; i++) {
                if (res.data[i].invites.indexOf($scope.currentUser._id) !== -1) {
                    $scope.pendingRequests.push(res.data[i]);
                }
            }
        });
    }).catch(err => {
        $scope.currentUser = null;
    });
    
    $scope.editProfile = function() {
        $scope.profileToEdit = true;
        $scope.profile = angular.copy($scope.currentUser);
        Materialize.updateTextFields();
    };

    $scope.cancelEdit = function() {
        $scope.profileToEdit = false;
    };

    $scope.saveProfile = function() {
        Auth.saveProfile($scope.profile).then(res => {
            $scope.currentUser = $scope.profile;
            $scope.profileToEdit = false;
        });
    };
});

app.controller('loginCtrl', function($scope, $state, Auth, $auth) {
    Auth.getProfile().then(res => {
        $scope.currentUser = res.data;
    }).catch(err => {
        $scope.currentUser = null;
    });

    $scope.authenticate = provider => {
        $auth.authenticate(provider).then(res => {
            $state.go('profile');
        });
    };
    
    $scope.loginUser = function() {
        Auth.login($scope.user).then(res => {
            $state.go('profile');
        });
    };
});

app.controller('logoutCtrl', function($scope, $state, Auth) {
    Auth.getProfile().then(res => {
        $scope.currentUser = res.data;
    }).catch(err => {
        $scope.currentUser = null;
    });

    Auth.logout().then(res => {
        $state.go('home');
    });
});

app.controller('detailsCtrl', function($scope, $state, Auth) {
    $scope.pendingRequests = [];

    Auth.getProfile().then(res => {
        $scope.currentUser = res.data;

        Auth.getAllProfiles().then(res => {
            for (var i = 0; i < res.data.length; i++) {
                if (res.data[i].invites.indexOf($scope.currentUser._id) !== -1) {
                    $scope.pendingRequests.push(res.data[i]);
                }
            }
        });
    }).catch(err => {
        $scope.currentUser = null;
    });

    Auth.getSingleProfile($state.params.id).then(res => {
        $scope.profile = res.data;
    });
});

app.controller('friendsCtrl', function($scope, Auth, Friends) {
    Auth.getProfile().then(res => {
        $scope.currentUser = res.data;

        $scope.pendingInvites = [];
        $scope.pendingRequests = [];
        $scope.friends = [];

        for (var i = 0; i < $scope.currentUser.invites.length; i++) {
            Friends.getUserById($scope.currentUser.invites[i]).then(res => {
                $scope.pendingInvites.push(res.data.username);
            });
        }

        Auth.getAllProfiles().then(res => {
            for (var i = 0; i < res.data.length; i++) {
                if (res.data[i].invites.indexOf($scope.currentUser._id) !== -1) {
                    $scope.pendingRequests.push(res.data[i]);
                }
            }
        });

        for (var i = 0; i < $scope.currentUser.friends.length; i++) {
            Friends.getUserById($scope.currentUser.friends[i]).then(res => {
                $scope.friends.push(res.data);
            });
        }

        Friends.getAvailableFriends($scope.currentUser.username, $scope.currentUser._id).then(res => {
            $scope.users = res.data;
        });
    }).catch(err => {
        $scope.currentUser = null;
    });

    $scope.addFriend = function() {
        Friends.sendInvite($scope.currentUser._id, $scope.userToInvite).then(res => {
            Friends.getUserById($scope.userToInvite).then(res => {
                $scope.pendingInvites.push(res.data.username);
            });
        });
    };
    
    $scope.rejectRequest = function(user2) {
        Friends.rejectRequest($scope.currentUser._id, user2._id).then(res => {
            var index = $scope.pendingRequests.indexOf(user2);
            $scope.pendingRequests.splice(index, 1);
        });
    };

    $scope.acceptRequest = function(user2) {
        Friends.rejectRequest($scope.currentUser._id, user2._id).then(res => {
            var index = $scope.pendingRequests.indexOf(user2);
            $scope.pendingRequests.splice(index, 1);
        });

        Friends.acceptRequest($scope.currentUser._id, user2._id).then(res => {
            $scope.friends.push(user2);
        });

        Friends.acceptRequest(user2._id, $scope.currentUser._id).then(res => {

        });
    };
});