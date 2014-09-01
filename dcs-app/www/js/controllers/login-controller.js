var loginController = function($q, $scope, $location, userDao, msg, app, dcsService) {
    $scope.users = [];
    $scope.user = {};
    var isNewUser = true;

    $scope.userSelected = function(user){
        if(user){
            if(user.$$hashKey)
                isNewUser = false;
            $scope.user = user.originalObject;
        }
    };

    $scope.login = function(){  
        msg.showLoading();
        app.user = $scope.user;
        if(isNewUser){
            return dcsService.verifyUser($scope.user)
            .then(userDao.addUser($scope.user)).then(function(){
                msg.hideAll();
                app.isAuthenticated = true;
                $location.path('/local-project-list');
            });
        } else {
            return userDao.updateUrl($scope.user).then(function(){
                msg.hideAll();
                app.isAuthenticated = true;
                $location.path('/local-project-list');
            });
        }
        checkDBFileExists($scope.user).then(ifExists, ifNotExists);
    };

    var onLoad = function(){
        userDao.createRegister()
        .then(userDao.getUsers().then(function(users){
            $scope.users = users;
        }));
    };

    onLoad();

};
dcsApp.controller('loginController', ['$q', '$scope', '$location', 'userDao', 'messageService', 'app', 'dcsService', loginController]);