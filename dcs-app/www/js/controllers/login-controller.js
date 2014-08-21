dcsApp.controller('loginController', ['$scope', '$location', 'userDao', 'auth', 'messageService', 'settings', function($scope, $location, userService, auth, msg, settings) {
    msg.showLoading();
    $scope.users = [{'name':'New', 'password': '', 'serverUrl':'https://172.18.29.3'}];
    userService.getUsers().then(function(users) {
        users.forEach(function(user) {
            console.log(user);
            var userForView = {'name':user.user_name, 'password':'', 'serverUrl':user.url};
            $scope.users.push(userForView);
        });
        var last_visited_user = $scope.users[$scope.users.length-1];
        $scope.current_user = last_visited_user;
        msg.hideAll();
       },function(error) {
        msg.hideLoadingWithErr('Unable to connect to local storage');
    });

    $scope.createNewUser = function(user) {
        auth.createValidLocalStore(user)
            .then(function() {
                console.log('createValidLocalStore resolved');
                settings.isAuthenticated = true;
                settings.user = user;
                $location.path('/local-project-list');
            }, function(error) {
                console.log(error);
                msg.hideLoadingWithErr('Server authentication failed '+error);
        });
    };

    $scope.loginExisting =  function(user) {
        auth.validateLocalUser(user)
            .then(function(user) {
                msg.hideAll();
                settings.isAuthenticated = true;
                settings.user = user;
                $location.path('/local-project-list');
            }, function() {
                msg.hideLoadingWithErr('Invalid login details');
                $location.path('/');
            });

    };
}]);
