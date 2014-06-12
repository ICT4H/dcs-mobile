dcsApp.controller('loginController', ['$rootScope', '$scope', '$location', 'userService', 'auth', function($rootScope, $scope, $location, userService, auth){

    $rootScope.loading = true;
    $scope.user = {};

    userService.getDetails().then(function(details) {

        // later user will be selcting existing/new check box to selct/enter user name
        // For now assuming there will be only one user per app.

        if (details.length != 0) {
            $scope.user.name = details[0].user_name;
            //$scope.user.password = '';
            $scope.user.serverUrl = details[0].url;
        }

        $rootScope.loading = false;
        $scope.$apply();
    },function(error) {
        $rootScope.displayError(error);
    });

    $scope.saveDetails = function(user) {
        auth(user.name, user.password, user.serverUrl).then(function(isValidUser) {
            if (isValidUser) {
                $rootScope.isAuthenticated = true;
                $location.path('/project-list');
                $rootScope.apply();
            } else {
                $rootScope.displayError('Invalid login details. Try again.');
            }
        }, function(e) {
            $rootScope.displayError('Invalid login details. Try again later.');
        });
    };

    //TODO move the message related methods to a better place | may be a class
    $rootScope.disableMessage = function(){
        $rootScope.showMessage = false;
        $rootScope.apply();
    };

    var enableMessage = function(MessageType,message){
        $rootScope.css = MessageType;
        $rootScope.message_to_display = message;
        $rootScope.showMessage = true;
        $rootScope.apply();
    };

    $rootScope.hideLoading = function() {
        $rootScope.loading = false;
        $rootScope.apply();
    }

    $rootScope.apply = function() {
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }

    $rootScope.displaySuccess = function(message){
        enableMessage("alert-success", message);
    };

    $rootScope.displayInfo = function(message){
        enableMessage("alert-info",message);
    };

    $rootScope.displayError = function(message){
        enableMessage("alert-danger",message);
    };

}]);

