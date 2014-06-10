dcsApp.controller('loginController', ['$rootScope', '$scope', 'userService', function($rootScope, $scope, userService){

    $scope.serverDetails = {
        username: '',
        password: '',
        serverUrl: ''
    };
    $rootScope.loading = false;
    $scope.new_user ={};    
    userService.getDetails().then(function(details){
        $scope.new_user.name = details[0].user_name;
        $scope.new_user.password = '';
        $scope.new_user.serverUrl = details[0].url;
        $scope.$apply();
        },function(error){
            $rootScope.displayError(error);
        });

    $scope.saveDetails = function(new_user){ 
        userService.createUser(new_user.name,new_user.serverUrl).then(function(saveId){
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
