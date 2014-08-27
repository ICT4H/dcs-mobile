var loginController = function($scope, $location, userDao, auth, msg, settings) {
    $scope.users = [];
    var onLoad = function(){
        msg.showLoading();
        $scope.users = [{'name':'New', 'password': '', 'url':''}];
        userDao.createTable()
        .then(userDao.getUsers)
        .then(function(users) {
            users.forEach(function(user) {
                $scope.users.push({'name':user.name, 'password':'', 'url':user.url});
            });
            $scope.currentUser = $scope.users[$scope.users.length - 1];
            msg.hideAll();
        });
    };
    
    $scope.newUser = function(user) {
        settings.user = user;
        auth.createValidLocalStore(user)
            .then(function() {
                settings.isAuthenticated = true;
                $location.path('/local-project-list');
            }, function(error) {
                msg.hideLoadingWithErr('Server authentication failed '+ error);
        });
    };

    $scope.existingUser =  function(user) {
        settings.user = user;
        auth.validateUser(user)
            .then(function() {
                settings.isAuthenticated = true;
                $location.path('/local-project-list');
            }, function() {
                msg.hideLoadingWithErr('Invalid login details');
                $location.path('/');
            });
    };

    onLoad();

};
dcsApp.controller('loginController', ['$scope', '$location', 'userDao', 'auth', 'messageService', 'settings', loginController]);