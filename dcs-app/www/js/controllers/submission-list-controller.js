dcsApp.controller('submissionListController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService',  'submissionDao', 
    function($rootScope, $scope, $routeParams, $location, dcsService, submissionDao){
    
	$scope.form_code = $routeParams.projectId;
    $rootScope.loading = true;
    var serverSubmissions = [];

    $rootScope.displayInfo('Updating submission list........');

    dcsService.getSubmissions($scope.form_code).then(function(serverSubmissions){
        submissionDao.getAllSubmission($scope.form_code, function(localSubmissions){
            $scope.$apply(function(){
                $rootScope.disableMessage();
                $scope.submissions = manageSubmissions(localSubmissions, serverSubmissions);
            });
        },function(error){$rootScope.displayError(error);});
    });

    var manageSubmissions = function(localSubmissions, serverSubmissions){
        $rootScope.loading = false;
        var submissions =[];
        if(serverSubmissions.length == 0){
            localSubmissions.forEach(function(localSubmission){
                localSubmission['in'] = 'browser';
                submissions.push(localSubmission);
            }); 
            return submissions;
        }

        serverSubmissions.forEach(function(serverSubmission){
            submissions.push(serverSubmission);
            serverSubmission['in'] = 'server';
        });

        localSubmissions.forEach(function(localSubmission){
            var flag = false;
            submissions.forEach(function(submission){
                if(localSubmission.id == submission.id){
                    submission['in'] = 'both';
                    flag = true;
                }
            });
            if(!flag){
                localSubmission['in'] = 'browser';
                submissions.push(localSubmission);
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
