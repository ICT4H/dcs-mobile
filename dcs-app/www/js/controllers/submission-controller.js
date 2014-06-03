dcsApp.controller('submissionController', ['$rootScope', '$routeParams', 'localStore', function($rootScope, $routeParams, localStore){
    
    var submission_id = $routeParams.submission_id;
    var project_id = $routeParams.project_id;
    var buttonLabel = 'Save';
    var onSuccess = function(message){
    	$rootScope.displaySuccess(message);
    };
    var onError = function(message){
    	$rootScope.displayError(message);
    };	

    if(submission_id != "null")
    	buttonLabel = 'Update';

    options = {
    	'localStore': localStore,
    	'buttonLabel': buttonLabel,
		'project_id': project_id,
		'submission_id': submission_id,
		'onSuccess': onSuccess,
		'onError': onError
	};
    loadEnketo(options);

}]);
