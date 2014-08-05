dcsApp.controller('loginController', ['$rootScope', '$scope', '$location', 'userService', 'auth', 'messageService', function($rootScope, $scope, $location, userService, auth, msg) {
    msg.showLoading();
    $scope.users = [{'name':'New', 'password': '', 'serverUrl':'https://172.18.29.3'}];
    userService.getUsers().then(function(users) {
        // TODO User will be selcting existing/new check box to selct/enter user name
        // For now assuming there will be only one user per app.
        users.forEach(function(user) {
            console.log(user);
            var userForView = {'name':user.user_name, 'password':'', 'serverUrl':user.url};
            $scope.users.push(userForView);
        });
        msg.hideAll();
       },function(error) {
        msg.hideLoadingWithErr('Unable to connect to local storage');
    });
    $scope.createNewUser = function(user) {
        auth.createValidLocalStore(user)
            .then(function() {
                console.log('createValidLocalStore resolved');
                $rootScope.isAuthenticated = true;
                $location.path('/local-project-list');
            }, function(error) {
                console.log(error);
                msg.hideLoadingWithErr('Server authentication failed '+error);
            });
    };

    $scope.loginExisting =  function(user) {
        auth.validateLocalUser(user)
            .then(function() {
                msg.hideAll();
                $rootScope.isAuthenticated = true;
                $location.path('/local-project-list');
            }, function() {
                msg.hideLoadingWithErr('Invalid login details');
                $location.path('/');
            });

    };
}]);
