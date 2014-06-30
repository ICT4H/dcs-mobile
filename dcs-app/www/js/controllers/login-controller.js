dcsApp.controller('loginController', ['$rootScope', '$scope', '$location', 'userService', 'auth', 'messageService', function($rootScope, $scope, $location, userService, auth, msg) {

    msg.showLoading();
    $scope.user = {};
    $scope.user.loginType = 'existing';

    userService.getUsers().then(function(details) {

        // TODO User will be selcting existing/new check box to selct/enter user name
        // For now assuming there will be only one user per app.
        if (details.length >= 1) {
            $scope.user.name = details[0].user_name;
            $scope.user.serverUrl = details[0].url;
        }
        msg.hideAll();
    },function(error) {
        msg.hideLoadingWithErr('Unable to connect to local storage');
    });

    $scope.login = function(user) {
        msg.showLoading();
        if ('change' == user.loginType) {
            //TODO
        } else if ('new' == user.loginType) {
            auth.createValidLocalStore(user)
                .then(function() {
                    $rootScope.isAuthenticated = true;
                    $location.path('/project-list');
                }, function() {
                    msg.hideLoadingWithErr('Server authentication failed');
                });
        } else {// existing user
            auth.validateLocalUser(user)
                .then(function() {
                    msg.hideAll();
                    $rootScope.isAuthenticated = true;
                    $location.path('/project-list');
                }, function() {
                    msg.hideLoadingWithErr('Invalid login details');
                    $location.path('/');
                });

        }
    };



}]);

