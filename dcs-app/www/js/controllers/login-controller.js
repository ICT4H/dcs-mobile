var loginController = function($scope, $location, userDao, msg, app, dcsService) {
    $scope.users = [];
    $scope.user = {};
    var isNewUser;

    $scope.userSelected = function(user){
        isNewUser = user.isNew;
        $scope.user = user.originalObject;
    };

    var onSuccess = function(){
        app.isAuthenticated = true;
        msg.hideAll();
        $location.path('/local-project-list');
    };

    var onError = function(error){
        msg.hideLoadingWithErr(error);
        $location.path('/');
    }

    $scope.login = function(){  
        msg.showLoading();
        app.user = $scope.user;
        if(!isNewUser)
            userDao.updateUrl($scope.user).then(onSuccess, onError);
        else 
            dcsService.verifyUser($scope.user).then(function() {
                            userDao.addUser($scope.user).then(onSuccess, onError);
            }, onError);    
    };

    var onLoad = function(){
        userDao.createRegister()
        .then(userDao.getUsers().then(function(users){
            $scope.users = users;
        }));
    };

    onLoad();

};
dcsApp.controller('loginController', ['$scope', '$location', 'userDao', 'messageService', 'app', 'dcsService', loginController]);