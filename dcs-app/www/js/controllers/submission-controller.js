'use strict';

define(['dcsApp', 'dbService'], function(dcsApp, dbService){
    var submissionController = function($rootScope, $scope, $routeParams, $location, dbService){
        var surveyResponseId = $routeParams.surveyResponseId;

        var onSuccess = function(message){
        	$rootScope.displaySuccess(message);
        };
        var onError = function(message){
        	$rootScope.displayError(message);
        };	

        loadEnketo(dbService, $routeParams.surveyId, surveyResponseId, onSuccess, onError);
    };
    dcsApp.controller('submissionController', ['$rootScope', '$scope', '$routeParams', '$location', 'dbService', submissionController]);
}); 