var loginController = function($rootScope, $scope, $location, userDao, msg, app, dcsService, dialogService) {
    $scope.title = "collectdata";
    $scope.users = [];
    var defaultUrl = 'https://www.collectdata.in';
    $scope.user = {'url': defaultUrl};
    var isNewUser;
    $scope.changedUrl = "";
    
    $scope.userSelected = function(user){
        isNewUser = user.isNew;
        $scope.user = user.originalObject;
        console.log('$scope.user.url: ' + $scope.user.url);
        if (!$scope.user.url || $scope.user.url.length < 0)
            $scope.user.url = defaultUrl;
        if($scope.changedUrl) {
            $scope.user.url = $scope.changedUrl;
            $scope.changedUrl = "";            
        }
    };

    $scope.forgetPassword = function() {
        $location.path('/change-password');
    };

    $scope.login = function(){  
        msg.showLoading();
        app.user = $scope.user;
        $rootScope.user = app.user;
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

    $scope.saveUrl = function(changedUrl) {
        $scope.changedUrl = changedUrl;
    };

    app.goBack = function() {
        dialogService.confirmBox("Do you want to exit?", function() {
            navigator.app.exitApp();
        }, function() {});
    };

    function onLoad(){
        userDao.createRegister()
        .then(userDao.getUsers().then(function(users){
            $scope.users = users;
        }));
        $scope.isEmulator = isEmulator;
    };

    function onSuccess(){
        app.isAuthenticated = true;
        msg.hideAll();
        $location.path('/local-project-list');
    };

    function onError(error){
        msg.hideLoadingWithErr(error);
        $location.path('/');
    }

    onLoad();

};
dcsApp.controller('loginController', ['$rootScope', '$scope', '$location', 'userDao', 'messageService', 'app', 'dcsService', 'dialogService', loginController]);