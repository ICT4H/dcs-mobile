dcsApp.controller('submissionListController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService', 'localStore', 
    function($rootScope, $scope, $routeParams, $location, dcsService, localStore){
    
    $scope.pageTitle = $routeParams.project_name + " >>";
	var project_id = $routeParams.project_id;
    var project_uuid = $routeParams.project_uuid;
    $scope.project_id = project_id;

    $rootScope.loading = true;
    var serverSubmissions = [];

    var fetchMsg = 'Fetching submission list...';
    $rootScope.displayInfo(fetchMsg);

    localStore.getAllProjectSubmissions(project_id).then(function(localSubmissions) {
        $scope.$apply(function() {
            $scope.submissions = localSubmissions || [];
            $rootScope.disableMessage();
            $rootScope.loading = false;
        });
    }, $rootScope.displayError);

    $scope.$refreshContents = function() {
        console.log('submissions refreshContents clicked');
        $rootScope.displayInfo(fetchMsg);
        $rootScope.loading = true;
        dcsService.getAllSubmissions(project_uuid).then(function(serverSubmissions) {
            updateSubmissionsToDisplay($scope.submissions, serverSubmissions);
            $rootScope.loading = false;
            $rootScope.disableMessage();
        },function(error){$rootScope.displayError(error);});
    }

    var updateSubmissionsToDisplay = function(submissionsInScope, serverSubmissions) {
        var inScope;

        serverSubmissions.forEach(function(serverSubmission) {
            inScope = false;
            submissionsInScope.forEach(function(localSubmission){
                if (serverSubmission.submission_uuid == localSubmission.submission_uuid) {
                    inScope = true;
                }
            });

            if(!inScope) {
                serverSubmission['in'] = 'server';
                serverSubmission.project_id = project_id
                $scope.submissions.push(serverSubmission);
            }
        });
    };

    $scope.createSurveyResponse = function(project_id) {
        $location.path('/project/' + project_id + '/submission/' + null);
    };

    $scope.editSurveyResponse = function(submission) {
        $location.path('/project/' + submission.project_id + '/submission/' + submission.submission_id);
    };

    $scope.deleteSubmission = function(submission) {
        $rootScope.loading = true;
        localStore.deleteSubmission(submission.submission_id).then(function() {
            $rootScope.loading = false;
            $rootScope.displaySuccess("Submission deleted.");
        }, function(error){
            $rootScope.displayError("Submission deletion failed.")
        });

        if (submission['in'] == 'both') {
            submission['in'] = 'server';
        } else {
            $scope.submissions.splice($scope.submissions.indexOf(submission), 1);
        }
    };

    $scope.downloadSubmission = function(submission) {
        $rootScope.loading = true;

        dcsService.getSubmission(submission)
            .then(localStore.createSubmission)
            .then(function(resp) {
                submission['in'] = 'both';
                submission.submission_id = resp.submission_id;
                submission.html = resp.html;
                submission.xml = resp.xml;
                $rootScope.displaySuccess("Submission downloaded.");
            }, function(error) {
                $rootScope.displayError('Unable to download submission.');
            }).done(function() {
                $rootScope.hideLoading();
            });
    };

    $scope.postSubmission = function(submission) {
        $rootScope.loading = true;
        dcsService.postSubmission(submission).then(function(updatedSubmission) {
            $rootScope.loading = false;
            localStore.updateSubmissionMeta(submission.submission_id, updatedSubmission)
                .then(function() {
                        $rootScope.displaySuccess('Submitted successfully');
                    },function(error) {
                        $rootScope.displayError('Submitted to server, local status not updated.');
                    });;

        }, function(error){
            if (error.status == '404') {
                // this submission is not avail in the server. Delete your local copy.
            }
            $rootScope.displayError('Unable to submit submission.');
        });

        submission['in'] = 'both';
    };
}]);
