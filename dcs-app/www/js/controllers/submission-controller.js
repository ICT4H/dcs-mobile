dcsApp.controller('submissionController', ['$rootScope', '$routeParams', 'localStore', 'messageService', function($rootScope, $routeParams, localStore, msg){
    
    var submission_id = $routeParams.submission_id;
    var project_id = $routeParams.project_id;
    var buttonLabel = 'Save';
    var onSuccess = function(message){
    	msg.displaySuccess(message);
    };
    var onError = function(message){
    	msg.displayError(message);
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
