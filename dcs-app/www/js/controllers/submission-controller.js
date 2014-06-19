dcsApp.controller('submissionController', ['$routeParams', 'localStore', 'messageService', function($routeParams, localStore, msg){
    
    var submission_id = $routeParams.submission_id;
    var project_id = $routeParams.project_id;
    var buttonLabel = 'Save';

    if(submission_id != "null")
    	buttonLabel = 'Update';

    options = {
    	'localStore': localStore,
    	'buttonLabel': buttonLabel,
		'project_id': project_id,
		'submission_id': submission_id,
		'onSuccess': msg.displaySuccess,
		'onError': msg.displayError
	};
    loadEnketo(options);

}]);
