dcsApp.controller('submissionListController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService',  'submissionDao', 'localStore', 
    function($rootScope, $scope, $routeParams, $location, dcsService, submissionDao, localStore){
    
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
            $scope.submissions = manageSubmissions(localSubmissions, []);
            $rootScope.disableMessage();
        });
    }, $rootScope.displayError);

    // submissionDao.getAllSubmission($scope.form_code, function(localSubmissions){
    //     $scope.$apply(function(){
    //         $scope.submissions = manageSubmissions(localSubmissions, []);
    //         $rootScope.disableMessage();
    //     });
    // },function(error){$rootScope.displayError(error);});

    $scope.$refreshContents = function() {
        console.log('submissions refreshContents clicked');
        $rootScope.displayInfo(fetchMsg);
        $rootScope.loading = true;
        dcsService.getSubmissions(project_uuid).then(function(serverSubmissions){
            $scope.$apply(function(){
                $scope.submissions = manageSubmissions($scope.submissions, serverSubmissions);
                $rootScope.disableMessage();
                $rootScope.loading = false;
            });
        },function(error){$rootScope.displayError(error);});
    }

    var manageSubmissions = function(localSubmissions, serverSubmissions){

        //TODO needs to be improved
        $rootScope.loading = false;
        var submissions =[];
        if(serverSubmissions.length == 0){
            localSubmissions.forEach(function(localSubmission){
                localSubmission['in'] = 'local';
                submissions.push(localSubmission);
            }); 
            return submissions;
        }

        localSubmissions.forEach(function(localSubmission){
            submissions.push(localSubmission);
            localSubmission['in'] = 'local';
        });

        serverSubmissions.forEach(function(serverSubmission){
            var flag = false;
            submissions.forEach(function(submission){
                if(submission.submission_uuid && serverSubmission.submission_uuid == submission.submission_uuid){
                    submission['in'] = 'both';
                    flag = true;
                }
            });
            if(!flag){
                serverSubmission['in'] = 'server';
                submissions.push(serverSubmission);
            }
        });
        return submissions;
    };

    $scope.createSurveyResponse = function(project_id){
        $location.path('/project/' + project_id + '/submission/' + null);
    };

    $scope.editSurveyResponse = function(submission){
        $location.path('/project/' + submission.project_id + '/submission/' + submission.submission_id);
    };

    $scope.deleteSurveyResponse = function(submission){

        localStore.deleteSubmission(submission.submission_id).then(function() {
            
            $rootScope.displaySuccess("Submission deleted.");
        }, function(error){
            $rootScope.displayError("Submission deletion failed.")
        });
    };

    $scope.downloadSubmission = function(submission){
        submission.project_id = project_id
        localStore.createSubmission(submission).then(function(storedId) {
            $rootScope.displaySuccess("Submission downloaded.");
        }, function(e) {
            $rootScope.displayError('Unable to download submission.');
        });
    };

    $scope.postSubmission = function(submission){
        dcsService.postSubmission(submission).then(function(updatedSurveyResponse){
            submissionDao.updateSurveyResponse(submission, updatedSurveyResponse,function(id){
                $location.path('/submission-list/' + updatedSurveyResponse.form_code);
                $rootScope.displaySuccess('Submitted successfully!');
            });
        },function(error){
            console.log(error);
        });
    };
}]);
