
dcsApp.service('dataProvider', ['$q' ,'submissionDao', function($q, submissionDao) {
/*
Provides abstraction over local store and server service.
*/
    this.init = function(projectUuid, type, searchStr, isServer) {
        this.projectUuid = projectUuid;
        this.type = type;
        this.searchStr = searchStr;
    };

    this.getSubmission = function(currentIndex) {
        if (isNaN(currentIndex)) return $.when();

        if (this.isServer) {

        } else {
            return submissionDao.searchSubmissionsByType(this.projectUuid, this.type, this.searchStr, currentIndex, 1).then(function(result) {
                return result;
            });
        }
    }

    this.getProject = function() {
        return submissionDao.getProjectById(this.projectUuid);
    }
}]);

dcsApp.service('enketoService', ['$location', '$route', 'app', 'contextService' ,'submissionDao', 'messageService', 'dialogService',
                        function($location, $route, app, contextService, submissionDao, msg, dialogService) {
/*
Provides submission create and update using enketo. Uses local store for persistence.
*/
    var dbSubmission, parentUuid, projectUuid, isNew;

    this.loadEnketo = function(project, submissionToEdit) {
        contextService.setProject(project);
        contextService.setSubmission(submissionToEdit);

        projectUuid = project.project_uuid;
        dbSubmission = submissionToEdit;
        parentUuid = contextService.getParentUuid();
        isNew = submissionToEdit? false: true;

        var options = {
            'buttonLabel': isNew? 'Save': 'Update',
            'hideButton': contextService.isParentProject()? true:false,
            'onButtonClick': submissionToEdit? onEdit: onNew,
            'submissionXml': contextService.getModelStr(),
            'xform': contextService.getXform()
        };
        if(isEmulator) {
            loadEnketo(options);
            return;
        } else if (isNew) {
            fileSystem.changeToTempAndClear(app.user.name).then(function() {
                loadEnketo(options);
            });
        } else {
            fileSystem.setWorkingDir(app.user.name, projectUuid + '/' + dbSubmission.submission_id).then(function() {
                loadEnketo(options);
            });
        }
    };

    this.getUrlsToAddChildren = function() {
        return contextService.getUrlsToAddChildren().map(function(urlToAddChildren) {
            return {'onClick': function() {
                $location.url(urlToAddChildren.url);       
            }, 'label': urlToAddChildren.label}
        });
    };

    var onError = function(){
        msg.hideLoadingWithErr(resourceBundle.failed_to_save);
    }

    var onEdit = function(submission) {
        submission.submission_id = dbSubmission.submission_id;
        submission.submission_uuid = dbSubmission.submission_uuid;
        submission.version = dbSubmission.version;
        submission.status = "modified";
        submission.project_uuid = dbSubmission.project_uuid;   
        msg.displaySuccess('Updating submission');
        submissionDao.updateSubmission(submission).then(function() {
            $location.url('/submission-list/' + dbSubmission.project_uuid + '?type=all');
        }, onError);
    };

    var onNew = function(submission) {
        submission.status = "modified";
        submission.project_uuid = projectUuid;
        submissionDao.createSubmission(submission).then(function() {
            _moveRecentTempFiles();
            msg.displaySuccess('Saved');
            var goToSubmissionList = function() {
                $location.url('/submission-list/' + (parentUuid? parentUuid : projectUuid) + '?type=all');
            }
            var reload = function() {
                $route.reload();
            }
            dialogService.confirmBox("Do you want to create another one?", reload, goToSubmissionList);
        }, onError);
    };

    var _moveRecentTempFiles = function() {
        return submissionDao.getRecentlyCreateSubmissionId().then(function(result) {
            var recentlyCreatedSubmissionId = result[0].rowid;
            return _moveMediaFiles(recentlyCreatedSubmissionId)
        })
    }

    var _moveMediaFiles = function(submissionId) {
        console.log('in _moveMediaFiles');
        var partialPath = projectUuid + '/' + submissionId;
        fileSystem.moveTempFilesToFolder(app.user.name, partialPath);
    }


}]);

var Page = function($location, baseUrl, type, searchStr, currentIndex, totalRecords) {

    this.getTotal = function() {
        return totalRecords;
    }

    this.showPagination = function() {
        //dont show for create submission
        return !isNaN(currentIndex);
    }

    this.getTo = function() {
        return currentIndex + 1;
    }

    this.isFirstPage = function() {
        return currentIndex === 0;
    }

    this.isLastPage = function() {
        return currentIndex + 1 === totalRecords;
    }

    this.onNext = function() {
        $location.url(baseUrl + '?type='+type+'&searchStr='+searchStr+'&currentIndex=' + (currentIndex+1));
    }

    this.onPrevious = function() {
        $location.url(baseUrl + '?type='+type+'&searchStr='+searchStr+'&currentIndex=' + (currentIndex-1));
    }
}

dcsApp.controller('submissionController',
    ['$scope', '$routeParams', '$location', 'enketoService', 'dataProvider', 'app', 'submissionDao', 'dcsService', 'dialogService',
    function($scope, $routeParams, $location, enketoService, dataProvider, app, submissionDao, dcsService, dialogService){
    
    $scope.showSearchicon = false;
    $scope.server = $routeParams.server == "true"? true:false;

    var currentIndex = parseInt($routeParams.currentIndex);
    var type = $routeParams.type || 'all';
    var searchStr = $routeParams.searchStr || '';
    var submissionId;

    var onDelete = function(submission) {
         dialogService.confirmBox(resourceBundle.confirm_data_delete, function() {
            submissionDao.deleteSubmissions([submissionId]).then(function() {
                var submissionFolder = $routeParams.project_uuid + '/' + submissionId;
                fileSystem.deleteUserFolders(app.user.name, [submissionFolder]);

                if($scope.page.isLastPage())
                    app.goBack();
                else {
                    "data_deleted".showInfo();
                    loadSubmission();
                }
            }, function(error){
                "failed_data_deletion".showError();
            });
        });
    };

    var onSubmit = function() {
        "data_submit_msg".showInfoWithLoading();
        submissionDao.getSubmissionById(submissionId)
                    .then(dcsService.postSubmissionAndPurgeObsoluteMedia)
                    .then(dcsService.postSubmissionNewMedia)
                .then(submissionDao.updateSubmission)
                    .then(function() {
                        if($scope.page.isLastPage())
                            app.goBack();
                        else {
                            "done".showInfo();
                            loadSubmission();
                        }
                    },function() {
                        msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
                    });
    };

    var loadActions  = function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onDelete, 'label': resourceBundle.delete});
        $scope.actions.push({'onClick': onSubmit, 'label': resourceBundle.submit});
    };


    var addPagination = function(type, searchStr, currentIndex, total) {
        var baseUrl = '/projects/'+$routeParams.project_uuid+'/submissions/'+currentIndex+'/';
        $scope.page = new Page($location, baseUrl, type, searchStr, currentIndex, total);
    }

    dataProvider.init($routeParams.project_uuid, type, searchStr, $scope.server);

    var loadSubmission = function() {
        dataProvider.getProject().then(function(project) {
            dataProvider.getSubmission(currentIndex).then(function(result) {
                var submission = result && result.data[0];
                submissionId = submission && submission.submission_id;
                addPagination(type, searchStr, currentIndex, result && result.total);
                enketoService.loadEnketo(project, submission);
                if($routeParams.currentIndex)
                        loadActions();
                $scope.actions = $scope.union($scope.actions, enketoService.getUrlsToAddChildren());
            });
        });
    };

    loadSubmission();

    app.goBack = function() {
        $location.url('/submission-list/' + $routeParams.project_uuid + '?type=' + type);
    };
}]);
