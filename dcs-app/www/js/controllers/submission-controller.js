dcsApp.controller('submissionController', ['$rootScope', '$routeParams', 'dbService', function($rootScope, $routeParams, dbService){
    
    var surveyResponseId = $routeParams.surveyResponseId;
    var buttonLabel = 'Save';
    var onSuccess = function(message){
    	$rootScope.displaySuccess(message);
    };
    var onError = function(message){
    	$rootScope.displayError(message);
    };	

    if(surveyResponseId != "null")
    	buttonLabel = 'Update';

    options = {
    	'dbService' : dbService,
    	'buttonLabel' : buttonLabel,
		'surveyId' : $routeParams.surveyId,
		'surveyResponseId' : surveyResponseId,
		'onSuccess' : onSuccess,
		'onError' : onError
	};
    loadEnketo(options);

}]);
