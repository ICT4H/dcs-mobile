dcsApp.controller('submissionListController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService', 'localStore', 'messageService',
    function($rootScope, $scope, $routeParams, $location, dcsService, localStore, msg){
    
    $scope.pageTitle = "Submissions";
    msg.showLoadingWithInfo('Loading submissions');

    var project_id = $routeParams.project_id;
    var project_uuid = $routeParams.project_uuid;
    $scope.project_id = project_id;
    var serverSubmissions = [];
    $scope.outdateProject = false;
    $scope.deletedProject = false;

    localStore.getProjectById(project_id)
        .then(function(project) {

            setObseleteProjectWarning(project);

            localStore.getAllProjectSubmissions(project_id)
                .then(function(localSubmissions) {
                    $scope.submissions = localSubmissions || [];
                    msg.hideAll();
                }, function(e) {
                    msg.hideLoadingWithErr('Unable to show local submissions');
                });
        });

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

    $scope.compare = function(localSubmission) {
        msg.showLoadingWithInfo('Fetching latest server submission');
        localSubmission.project_uuid = project_uuid;
        dcsService.getSubmission(localSubmission)
            .then(function(serverSubmission) {
                serverSubmission.status = BOTH;
                localSubmission.serverSubmission = serverSubmission;
                msg.hideAll();
            }, function(e){
                msg.hideLoadingWithErr('Failed to get server submission');
            });
    }

    $scope.takeLocalSubmission = function(s) {
        function onConfirm(buttonIndex) {
            if(buttonIndex==BUTTON_NO) return;

            localStore.updateSubmissionVersionAndStatus(s.submission_id, s.serverSubmission.version, s.serverSubmission.status);
            s.status = BOTH;
            msg.displaySuccess('Local changes taken');

        };
        navigator.notification.confirm(
            'Do you want take local changes ?',
            onConfirm,
            'Submission',
            ['Yes','No']
        );
    };

    $scope.takeServerSubmission = function(s) {
        function onConfirm(buttonIndex) {
            if(buttonIndex==BUTTON_NO) return;

            localStore.updateSubmission(s.submission_id, s.serverSubmission);
            s.html = s.serverSubmission.html;
            s.xml = s.serverSubmission.xml;
            s.status = BOTH;
            msg.displaySuccess('Server changes taken');

        };
        navigator.notification.confirm(
            'Do you want take server changes ?',
            onConfirm,
            'Submission',
            ['Yes','No']
        );
       
    }

    $scope.createSurveyResponse = function(project_id) {
        $location.path('/project/' + project_id + '/submission/' + null);
    };

    $scope.editSurveyResponse = function(submission) {
        $location.path('/project/' + submission.project_id + '/submission/' + submission.submission_id);
    };

    $scope.deleteSubmission = function(submission) {
         function onConfirm(buttonIndex) {
            if(buttonIndex==BUTTON_NO) return;

        localStore.deleteSubmission(submission.submission_id)
            .then(function() {
                updateScopeSubmission(submission);
                msg.hideLoadingWithInfo("Submission deleted");
            }, function(error){
                msg.hideLoadingWithErr("Submission deletion failed")
            });
        };
        navigator.notification.confirm(
            'Do you want to delete ?',
            onConfirm,
            'Delete submission',
            ['Yes','No']
        );
    };

    $scope.downloadSubmission = function(submission) {
        msg.showLoading();
        submission.status = BOTH;
        dcsService.getSubmission(submission)
            .then(localStore.createSubmission)
            .then(function(resp) {
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
                    submission.status = BOTH;
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

    var setObseleteProjectWarning = function(project) {
        delete $scope.projectWarning;

        if(project.status == OUTDATED) {
            $scope.outdateProject = true;
            $scope.projectWarning = 'The porject is outdated. You can only submit existing submissions.';
        }

        if(project.status == SERVER_DELETED) {
            $scope.deletedProject = true;
            $scope.projectWarning = 'No actions other that delete is premited since project is deleted from server';
        }
    }

    var updateSubmissionsToDisplay = function(submissionsInScope, serverSubmissions) {

        serverSubmissions.forEach(function(serverSubmission) {
            serverSubmission.status = SERVER;
            submissionsInScope.forEach(function(localSubmission) {
                if (serverSubmission.submission_uuid == localSubmission.submission_uuid) {
                    serverSubmission.status = BOTH;
                }
            });

            if(serverSubmission.status == SERVER) {
                serverSubmission.project_id = project_id
                $scope.submissions.push(serverSubmission);
            }
        });

        var onServer, outdated;
        submissionsInScope.forEach(function(localSubmission) {
            if(BOTH == localSubmission.status) {
                onServer = outdated = false;
                serverSubmissions.forEach(function(serverSubmission) {
                    if (serverSubmission.submission_uuid == localSubmission.submission_uuid) {
                        onServer = true;
                        if (serverSubmission.version != localSubmission.version) {
                            outdated = true;
                        }
                    }
                });
                if(!onServer) {
                    localSubmission.status = SERVER_DELETED;
                    localStore.updateSubmissionStatus(localSubmission.submission_id, SERVER_DELETED);
                } else if (outdated) {
                    localSubmission.status = OUTDATED;
                    localStore.updateSubmissionStatus(localSubmission.submission_id, OUTDATED);
                }
            }
        });

    };

    var updateScopeSubmission = function(submission) {
        if (submission.status == BOTH) {
            submission.status = SERVER;
        } else {
            $scope.submissions.splice($scope.submissions.indexOf(submission), 1);
        }
    };
}]);
