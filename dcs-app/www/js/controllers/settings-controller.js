dcsApp.controller('settingsController', ['$rootScope', '$scope', 'userService', 'messageService', function($rootScope, $scope, userService, msg){

    $scope.serverDetails = {
        username: '',
        password: '',
        serverUrl: ''
    };
    $scope.user = {};
    msg.showLoading();

    $scope.saveDetails = function(){ 
        $scope.serverDetails.id = 'credentials';
        userService.createUser($scope.new_user.name,$scope.new_user.serverUrl).then(function(saveId){
            console.log('user created id:' + saveId);
            msg.hideLoadingWithInfo('Saved!');
        },function(error){
            msg.hideLoadingWithErr('Unable to create user');
        });
    };

    $scope.isFormValid = function(){
        return (!$scope.serverDetails.serverUrl) || 
                (!$scope.serverDetails.username) ||
                (!$scope.serverDetails.password) ||
                (!angular.equals($scope.serverDetails.password, $scope.serverDetails.confirmPassword));
    };
    
}]);
