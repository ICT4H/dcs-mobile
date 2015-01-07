dcsApp.controller('submissionController', ['$scope', '$routeParams', '$location', 'submissionDao', 'messageService', 'dcsService', 'app', 'contextService', function($scope, $routeParams, $location, localStore, msg, dcsService, app, contextService){
    
    var submission_id = $routeParams.submission_id;
    var buttonLabel = submission_id == "null" ?'Save':'Update';
    $scope.contextService = contextService;
    var getDate = function() {
        return new Date().toJSON();
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
        submission.is_modified = true;
        localStore.updateSubmission(submission)
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
                'Do you want to create another one?',
                onClick,
                'New submission',
                ['Yes','No']
            );
            msg.displaySuccess('Saved');

        }, function(error) {
            console.log(error);
        });
    };

    var setParametersForEnketo = function(submissionId) {
        localStore.getProjectById($routeParams.project_uuid).then(function(project) {
                var options = {
                    'saveSubmission': onSubmit,
                    'localStore': localStore,
                    'buttonLabel': buttonLabel,
                    'project': project,
                    'submission_id': submissionId,
                    'getDate': getDate,
                    'getSubmissionFromServer': getSubmissionFromServer,
                    'isServerSubmission' : $routeParams.server ? true : false
                };
                var project_name = project.name;
                var userEmail = app.user.name;

                fileSystem.setWorkingDir(userEmail, project_name);
                loadEnketo(options);
            });
    }
    var onLoad = function() {
        if(contextService.isListing)
            setParametersForEnketo(submission_id); 
        else
            setParametersForEnketo();            
    };
    $scope.onNext = function() {
        contextService.submissionIndex = contextService.submissionIndex + 1;
        $location.path('/project/' +  $routeParams.project_uuid + '/submission/' + contextService.submissions[contextService.submissionIndex].submission_id);
    };

    $scope.onPrevious = function() {
        contextService.submissionIndex = contextService.submissionIndex - 1;
        $location.path('/project/' +  $routeParams.project_uuid + '/submission/' + contextService.submissions[contextService.submissionIndex].submission_id);
    };


    onLoad();
}]);
