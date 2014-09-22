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

    var getSubmissionFromServer = function(submissionId) {
        return dcsService.getSubmission({'project_uuid':$routeParams.project_uuid, 'submission_uuid': submissionId});
    };

    var onSubmit = function(submission, callBack) {
        if (submission_id == 'null') {
            onNew(submission, callBack);
        } else {
            onEdit(submission);
        }
    };

    var onEdit = function(submission) {
        localStore.updateSubmission(submission_id, submission)
        .then(function() {
            msg.displaySuccess('Updated');
            $location.path("/submission-list/" + $routeParams.project_uuid);
        }, function(error) {
            console.log(error);
        });
    };

    var onNew = function(submission, initializeForm) {
        localStore.createSubmission(submission)
        .then(function(submission) {
            function onClick(buttonIndex) {
                if(buttonIndex==BUTTON_NO) {
                    msg.displaySuccess('Saved');
                    $location.path("/submission-list/" + $routeParams.project_uuid);
                }
                else
                    initializeForm();
            };
            navigator.notification.confirm(
                'Do you want to submit another one?',
                onClick,
                'Delete submission',
                ['Yes','No']
            );
            msg.displaySuccess('Saved');

        }, function(error) {
            console.log(error);
        });
    };

    options = {
        'saveSubmission': onSubmit,
        'localStore': localStore,
        'buttonLabel': buttonLabel,
        'project_uuid': $routeParams.project_uuid,
        'submission_id': submission_id,
        'getDate': getDate,
        'getSubmissionFromServer': getSubmissionFromServer, 
        'isServerSubmission' : $routeParams.server ? true : false 
    };
    loadEnketo(options);

}]);
