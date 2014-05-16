'use strict';

define(['dcsApp', 'services/dcs-service', '../dao/submission-dao'], function(dcsApp, dcsService, submissionDao){
    var submissionListController = function($rootScope, $scope, $routeParams, dcsService, submissionDao){
    	$scope.init = function(){
    		$scope.form_code = $routeParams.projectId;
            var serverSubmissions = null;
            dcsService.getSubmissions($scope.form_code).success(function(submissions){
                serverSubmissions = submissions;
            }).error(function(error){
                serverSubmissions =[];
            }).finally(function(){
                submissionDao.getAllSubmission($scope.form_code, function(localSubmissions){
                    $scope.$apply(function(){
                        $scope.submissions = manageSubmissions(localSubmissions, serverSubmissions);
                    });
                },function(error){console.log(error);});
            });
        };
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
        $scope.deleteSurveyResponse = function(surveyResponseId){
            submissionDao.deleteSurveyResponse(surveyResponseId, function(deletedId){
                console.log(deletedId + " deleted");
            });
        };

        $scope.downloadSurveyResponse = function(surveyResponse){
            submissionDao.storeSubmission(surveyResponse, function(storedId){
                console.log(storedId+ " stored");
            });
        };

        $scope.init();
  };
    return dcsApp.controller('submissionListController', ['$rootScope', '$scope', '$routeParams', 'dcsService',  'submissionDao', submissionListController]);
}); 

