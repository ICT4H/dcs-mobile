dcsApp.controller('settingsController', ['$rootScope', '$scope', 'userService', function($rootScope, $scope, userService){

    $scope.serverDetails = {
        username: '',
        password: '',
        serverUrl: ''
    };
    $scope.user = {};
    $rootScope.loading = false;

    $scope.saveDetails = function(){ 
        $scope.serverDetails.id = 'credentials';
        userService.createUser($scope.new_user.name,$scope.new_user.serverUrl).then(function(saveId){
            console.log(saveId);
            $rootScope.displaySuccess('Saved!');
        },function(error){
            $rootScope.displayError(error);
        });
    };

    $scope.isFormValid = function(){
        return (!$scope.serverDetails.serverUrl) || 
                (!$scope.serverDetails.username) ||
                (!$scope.serverDetails.password) ||
                (!angular.equals($scope.serverDetails.password, $scope.serverDetails.confirmPassword));
    };
    
}]);
