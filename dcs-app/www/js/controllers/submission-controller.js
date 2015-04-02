
dcsApp.service('enketoService', ['$location', '$route', 'app', 'contextService' ,'submissionDao', 'messageService', 'dialogService',
                        function($location, $route, app, contextService, submissionDao, msg, dialogService) {
/*
Provides submission create and update using enketo. Uses local store for persistence.
*/
    var dbSubmission, projectUuid, isNew;

    this.loadEnketo = function(project, submissionToEdit) {

        projectUuid = project.project_uuid;
        dbSubmission = submissionToEdit;
        isNew = submissionToEdit? false: true;

        var options = {
            'buttonLabel': isNew? 'Save': 'Update',
            'hideButton': contextService.selectParentFlow,
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
            var goToLocalProjects = function() {
                $location.url('/local-project-list');
            }
            var reload = function() {
                $route.reload();
            }
            dialogService.confirmBox("Do you want to create another one?", reload, goToLocalProjects);
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

dcsApp.controller('submissionController',
    ['$scope', '$routeParams', '$location', 'enketoService', 'submissionDao', 'app', 'submissionDao', 'dcsService', 'dialogService', 'contextService', 'singleItemPage',
    function($scope, $routeParams, $location, enketoService, submissionDao, app, submissionDao, dcsService, dialogService, contextService, singleItemPage){
    
    $scope.page = singleItemPage;
    $scope.showSearchicon = false;
    $scope.server = $routeParams.server == "true"? true:false;
    $scope.title = resourceBundle.createSubmission;

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

    function setSubTitleAndSelectAction() {
            var childProject = contextService.getChildProject();
            var childProjectName = childProject.name;
            $scope.title = 'Create new ' + childProjectName + ' using';

            var newChildUrl = '/projects/'+childProject.project_uuid+'/submissions/new_child';
            var selectAction = {
                'onClick': function() {
                    contextService.resetFlowForChildProject();
                    $location.url(newChildUrl);
                },
                'icon': 'fa fa-check fa-lg fa-fw',
                'label': 'Select'
            };
            $scope.actions = [selectAction];        
    }

    var addActions  = function(currentProject) {
        $scope.actions = [];
        var isEdit = $routeParams.currentIndex? true: false;

        if(contextService.isParentProject()) {
            setSubTitleAndSelectAction();
        } else if(isEdit) {
            $scope.actions.push({'onClick': onDelete, 'label': resourceBundle.delete});
            $scope.actions.push({'onClick': onSubmit, 'label': resourceBundle.submit});
        }
    };


    var addPagination = function(type, searchStr, currentIndex, total) {
        singleItemPage.init($routeParams.project_uuid, type, searchStr, currentIndex, total);
    }

    function getSubmissionByCurrentIndex(project_uuid, type, searchStr, currentIndex) {
        if (isNaN(currentIndex)) return $.when();

        return submissionDao.searchSubmissionsByType(project_uuid, type, searchStr, currentIndex, 1)
    }

    var loadSubmission = function() {

        var project = contextService.getProject();
        getSubmissionByCurrentIndex(project.project_uuid, type, searchStr, currentIndex).then(function(result) {
            var submission = result && result.data[0];
            contextService.setSubmission(submission);
            submissionId = submission && submission.submission_id;
            addPagination(type, searchStr, currentIndex, result && result.total);
            enketoService.loadEnketo(project, submission);
            addActions(project);
        });

    };

    loadSubmission();

    app.goBack = function() {
        $location.url('/submission-list/' + $routeParams.project_uuid + '?type=' + type);
    };
}]);
