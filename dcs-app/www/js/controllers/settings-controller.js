'use strict';

define(['dcsApp', 'dbService'], function(dcsApp, dbService){
    var settingsController = function($rootScope, $scope, dbService){
        $scope.serverDetails = {
            username: '',
            password: '',
            serverUrl: ''
        };
        $rootScope.loading = false;
        $scope.init = function(){
            dbService.get('credentials').then(function(credentials){
                $scope.$apply(function(){
                    $scope.serverDetails.username = credentials.username;
                    $scope.serverDetails.password = credentials.password;
                    $scope.serverDetails.serverUrl = credentials.serverUrl;
                });
            });
        };

        $scope.saveDetails = function(){ 
            $scope.serverDetails.id = 'credentials';
            dbService.put($scope.serverDetails).then(function(saveId){
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
        $scope.init();
    };
    dcsApp.controller('settingsController', ['$rootScope', '$scope', 'dbService', settingsController]);
}); 