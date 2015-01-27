var loginController = function($scope, $location, userDao, msg, app, dcsService) {
    $scope.title = "Garner";
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

    $scope.forgetPassword = function() {
        $location.path('/change-password');
    };

    $scope.login = function(){  
        msg.showLoading();
        app.user = $scope.user;
        if(!$scope.user.hasOwnProperty("name") || !$scope.user.hasOwnProperty("password")) {
            (101).showError();
            $location.path('/');    
            return;
        }
        if(!isNewUser)
            userDao.openUserStore(app.user)
            .then(function() {
                return userDao.updateUrl(app.user);
            })
            .then(onSuccess, function() {
                (102).showError();
                $location.path('/');    
            });
        else 
            dcsService.verifyUser($scope.user)
            .then(function(respone) {
                userDao.addUser(respone, $scope.user).then(onSuccess, onError);
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