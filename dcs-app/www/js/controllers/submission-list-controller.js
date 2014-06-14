dcsApp.controller('submissionListController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService', 'localStore', 'messageService',
    function($rootScope, $scope, $routeParams, $location, dcsService, localStore, msg){
    
    $scope.pageTitle = "Submissions";
    msg.showLoadingWithInfo('Loading submissions');

    var project_id = $routeParams.project_id;
    var project_uuid = $routeParams.project_uuid;
    $scope.project_id = project_id;
    var serverSubmissions = [];

    localStore.getAllProjectSubmissions(project_id)
        .then(function(localSubmissions) {
            $scope.submissions = localSubmissions || [];
            msg.hideAll();
        }, function(e) {
            msg.hideLoadingWithErr('Unable to show local submissions');
        }
    );

    $scope.$refreshContents = function() {
        console.log('submissions refreshContents clicked');
        msg.showLoadingWithInfo('Fetching server submissions');
        dcsService.getAllSubmissions(project_uuid)
            .then(function(serverSubmissions) {
                updateSubmissionsToDisplay($scope.submissions, serverSubmissions);
                msg.hideAll();
            }, function(error){
                msg.hideLoadingWithErr('Unable to fetch submissions')
            });
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

    var updateScopeSubmission = function(submission) {
        if (submission['in'] == 'both') {
            submission['in'] = 'server';
        } else {
            $scope.submissions.splice($scope.submissions.indexOf(submission), 1);
        }
    }

    $scope.deleteSubmission = function(submission) {
        msg.showLoading();
        localStore.deleteSubmission(submission.submission_id)
            .then(function() {
                updateScopeSubmission(submission);
                msg.hideLoadingWithInfo("Submission deleted");
            }, function(error){
                msg.hideLoadingWithErr("Submission deletion failed")
            });
    };

    $scope.downloadSubmission = function(submission) {
        msg.showLoading();
        dcsService.getSubmission(submission)
            .then(localStore.createSubmission)
            .then(function(resp) {
                submission['in'] = 'both';
                submission.submission_id = resp.submission_id;
                submission.html = resp.html;
                submission.xml = resp.xml;
                msg.hideLoadingWithInfo("Submission downloaded.");
            }, function(error) {
                msg.hideLoadingWithErr('Unable to download submission.');
            });
    };

    $scope.postSubmission = function(submission) {
        msg.showLoading();
        dcsService.postSubmission(submission).then(function(updatedSubmission) {
            localStore.updateSubmissionMeta(submission.submission_id, updatedSubmission)
                .then(function() {
                    submission['in'] = 'both';
                    msg.hideLoadingWithInfo('Submitted successfully');
                },function(error) {
                    msg.hideLoadingWithErr('Submitted to server, local status not updated.');
                });;

        }, function(error){
            if (error.status == '404') {
                // this submission is not avail in the server. Delete your local copy.
            }
            msg.hideLoadingWithErr('Unable to submit submission.');
        });
    };

}]);
