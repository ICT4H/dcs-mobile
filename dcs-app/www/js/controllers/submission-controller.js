dcsApp.controller('submissionController', ['$rootScope', '$routeParams', 'dbService', function($rootScope, $routeParams, dbService){
    
    var surveyResponseId = $routeParams.surveyResponseId;

    var onSuccess = function(message){
    	$rootScope.displaySuccess(message);
    };
    var onError = function(message){
    	$rootScope.displayError(message);
    };	

    loadEnketo(dbService, $routeParams.surveyId, surveyResponseId, onSuccess, onError);

}]);
