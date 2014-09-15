dcsApp.controller('submissionController', ['$routeParams', '$location', 'submissionDao', 'messageService', 'dcsService', function($routeParams, $location, localStore, msg, dcsService){
    
    var submission_id = $routeParams.submission_id;
    var buttonLabel = submission_id == "null" ?'Save':'Update';

    var getDate = function() {
        var now  =new Date();
        var date = now.toLocaleDateString();
        var time = now.toLocaleTimeString();
        time = time.replace(time.slice(time.length-6,time.length-3),'');
        return date.concat(' '+time)
    };

    var redirect = function(path){
        $location.path(path);
    };

    var getSubmissionFromServer = function(submissionId) {
        return dcsService.getSubmission({'project_uuid':$routeParams.project_uuid, 'submission_uuid': submissionId});
    };

    options = {
        'redirect': redirect,
        'localStore': localStore,
        'buttonLabel': buttonLabel,
        'project_uuid': $routeParams.project_uuid,
        'submission_id': submission_id,
        'onSuccess': msg.displaySuccess,
        'onError': msg.displayError,
        'getDate': getDate,
        'getSubmissionFromServer': getSubmissionFromServer, 
        'isServerSubmission' : $routeParams.server ? true : false 
    };
    loadEnketo(options);

}]);
