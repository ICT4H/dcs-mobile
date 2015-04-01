var changePasswordController = function($scope, $location, userDao, app, msg, dcsService) {
    var defaultUrl = 'https://garner.twhosted.com';
    $scope.user = {'url': defaultUrl};

    $scope.changePassword = function(user) {
        msg.showLoading();
        app.user = user;
		dcsService.verifyUser(user)
        .then(function(response) {
            return userDao.updateNewPassword(user, response);
        })
        .then(function() {
            msg.hideAll();
            $location.path('/');
        }, function(error) {
             msg.hideLoadingWithErr(error);
        });
	};

    var onLoad = function(){
        userDao.createRegister()
        .then(userDao.getUsers().then(function(users){
            $scope.users = users;
        }));
        $scope.isEmulator = isEmulator;
    };

    $scope.userSelected = function(user){
        $scope.user = user.originalObject;
        console.log('$scope.user.url: ' + $scope.user.url);
        if (!$scope.user.url || $scope.user.url.length < 0)
            $scope.user.url = defaultUrl;
    };

    app.goBack = function() {
        $location.url('/');
    };

    onLoad();
};	

dcsApp.controller('changePasswordController', ['$scope', '$location', 'userDao', 'app', 'messageService', 'dcsService', changePasswordController]);