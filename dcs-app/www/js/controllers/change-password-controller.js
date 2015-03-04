var changePasswordController = function($scope, $location, userDao, app, msg, dcsService) {
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
    };

    $scope.userSelected = function(user){
        $scope.user = user.originalObject;
    };

    app.goBack = function() {
        $location.url('/');
    };

    onLoad();
};	

dcsApp.controller('changePasswordController', ['$scope', '$location', 'userDao', 'app', 'messageService', 'dcsService', changePasswordController]);