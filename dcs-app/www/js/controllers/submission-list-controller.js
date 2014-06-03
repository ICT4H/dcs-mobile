dcsApp.controller('submissionListController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService', 'localStore', 
    function($rootScope, $scope, $routeParams, $location, dcsService, localStore){
    
    $scope.pageTitle = 'Submissions';
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
        dcsService.getSubmissions(project_uuid).then(function(serverSubmissions){
            $scope.$apply(function(){
                updateSubmissionsToDisplay($scope.submissions, serverSubmissions);
                $rootScope.disableMessage();
                $rootScope.loading = false;
            });
        },function(error){$rootScope.displayError(error);});
    }

    var updateSubmissionsToDisplay = function(submissionsInScope, serverSubmissions){
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
                $scope.submissions.push(serverSubmission);
            }
        });
    };

    $scope.createSurveyResponse = function(project_id){
        $location.path('/project/' + project_id + '/submission/' + null);
    };

    $scope.editSurveyResponse = function(submission){
        $location.path('/project/' + submission.project_id + '/submission/' + submission.submission_id);
    };

    $scope.deleteSubmission = function(submission){

        localStore.deleteSubmission(submission.submission_id).then(function() {
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

    $scope.downloadSubmission = function(submission){
        submission.project_id = project_id;

        localStore.createSubmission(submission).then(function(storedId) {
            $rootScope.displaySuccess("Submission downloaded.");
        }, function(e) {
            $rootScope.displayError('Unable to download submission.');
        });
        submission['in'] = 'both';
    };

    $scope.postSubmission = function(submission){
        $rootScope.loading = true;
        dcsService.postSubmission(submission).then(function(updatedSubmission){
            $rootScope.loading = false;
            $rootScope.displaySuccess('Submitted successfully!');
            localStore.updateSubmission(submission.submission_id, updatedSubmission.submission_uuid, updatedSubmission.created);

        }, function(error){
            $rootScope.displayError('Unable to submit submission.');
        });

        submission['in'] = 'both';
    };
}]);
