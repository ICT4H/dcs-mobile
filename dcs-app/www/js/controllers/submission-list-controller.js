dcsApp.controller('submissionListController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService',  'submissionDao', 
    function($rootScope, $scope, $routeParams, $location, dcsService, submissionDao){
    
    $scope.pageTitle = 'Submissions';
	$scope.form_code = $routeParams.projectId;
    $rootScope.loading = true;
    var serverSubmissions = [];

    $rootScope.displayInfo('Updating submission list...');

    submissionDao.getAllSubmission($scope.form_code, function(localSubmissions){
        $scope.$apply(function(){
            $scope.submissions = manageSubmissions(localSubmissions, []);
            $rootScope.disableMessage();
        });
    },function(error){$rootScope.displayError(error);});

    $scope.$refreshContents = function() {
        console.log('submissions refreshContents clicked');
        $rootScope.displayInfo('Updating submission list...');
        $rootScope.loading = true;
        dcsService.getSubmissions($scope.form_code).then(function(serverSubmissions){
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
                if(serverSubmission.id == submission.id){
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

    $scope.createSurveyResponse = function(surveyId){
        $location.path('/submission/' + surveyId + '/surveyResponse/' + null);
    };

    $scope.editSurveyResponse = function(surveyResponse){
        $location.path('/submission/' + surveyResponse.form_code + '/surveyResponse/' + surveyResponse.id);
    };

    $scope.deleteSurveyResponse = function(surveyResponse){
        var form_code = surveyResponse.form_code;
        submissionDao.deleteSurveyResponse(surveyResponse.id, function(deletedId){
            //TODO hack to move back to submission list
            $location.path('/submission-list/' + form_code);
            $rootScope.displaySuccess("Submission deleted!");
        });
    };

    $scope.downloadSurveyResponse = function(surveyResponse){
        submissionDao.storeSubmission(surveyResponse, function(storedId){
            $location.path('/submission-list/' + surveyResponse.form_code);
            $rootScope.displaySuccess("Submission downloaded!");
        });
    };

    $scope.postSubmission = function(surveyResponse){
        dcsService.postSubmission(surveyResponse).then(function(updatedSurveyResponse){
            submissionDao.updateSurveyResponse(surveyResponse, updatedSurveyResponse,function(id){
                $location.path('/submission-list/' + updatedSurveyResponse.form_code);
                $rootScope.displaySuccess('Submitted successfully!');
            });
        },function(error){
            console.log(error);
        });
    };
}]);
