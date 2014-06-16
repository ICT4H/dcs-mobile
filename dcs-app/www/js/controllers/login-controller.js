dcsApp.controller('loginController', ['$rootScope', '$scope', '$location', 'userService', 'auth', 'messageService', function($rootScope, $scope, $location, userService, auth, msg) {

    msg.showLoading();
    $scope.user = {};

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

    $scope.saveDetails = function(user) {
        msg.showLoading();
        auth.validateUser({userName: user.name, password: user.password, url: user.serverUrl}).then(function() {
            $rootScope.isAuthenticated = true;
            $location.path('/project-list');
            $scope.$apply();
        }, function(e) {
            msg.hideLoadingWithErr('Invalid login details.');
        });
    };



}]);

