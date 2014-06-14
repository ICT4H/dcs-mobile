dcsApp.controller('loginController', ['$rootScope', '$scope', '$location', 'userService', 'auth', 'localStore', 'messageService', function($rootScope, $scope, $location, userService, auth, localStore, msg) {

    msg.showLoading();
    $scope.user = {};

    userService.getUsers().then(function(details) {

        // later user will be selcting existing/new check box to selct/enter user name
        // For now assuming there will be only one user per app.
        if (details.length >= 1) {
            $scope.user.name = details[0].user_name;
            $scope.user.serverUrl = details[0].url;
        }
        msg.hideLoading();
    },function(error) {
        msg.displayError('Unable to connect to local storage');
    });

    $scope.saveDetails = function(user) {
        auth(user.name, user.password, user.serverUrl).then(function(isValidUser) {
            if (isValidUser) {
                $rootScope.isAuthenticated = true;
                $location.path('/project-list');
                //$rootScope.apply();
                $scope.$apply();
            } else {
                $rootScope.displayError('Invalid login details. Try again.');
            }
        }, function(e) {
            $rootScope.displayError('Invalid login details. Try again later.');
        });
    };



}]);

