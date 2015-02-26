
dcsApp.service('dataProvider', ['$q' ,'submissionDao', function($q, submissionDao) {
/*
Provides abstraction over local store and server service.
*/
    this.init = function(projectUuid, type, searchStr, isServer) {
        this.takeCachedProject = this.projectUuid && this.projectUuid == projectUuid
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

    var cachedProject;
    var setProjectInCache = function(project) {
        cachedProject = project;
        return $.when(project);
    }

    this.getProject = function() {
        if (this.takeCachedProject) {
            return $q.when(cachedProject);
        } else {
            return submissionDao.getProjectById(this.projectUuid).then(setProjectInCache);
        }
    }
}]);

dcsApp.service('enketoService', ['$location', '$route', 'contextService' ,'submissionDao', 'messageService', 'dialogService',
                        function($location, $route, contextService, submissionDao, msg, dialogService) {
/*
Provides submission create and update using enketo. Uses local store for persistence.
*/
    var dbSubmission, parentUuid, projectUuid;

    this.loadEnketo = function(project, submissionToEdit) {
        contextService.setProject(project);
        contextService.setSubmission(submissionToEdit);

        projectUuid = project.project_uuid;
        dbSubmission = submissionToEdit;
        parentUuid = contextService.getParentUuid();

        loadEnketo({
            'buttonLabel': submissionToEdit? 'Update': 'Save',
            'hideButton': contextService.isParentProject()? true:false,
            'onButtonClick': submissionToEdit? onEdit: onNew,
            'submissionXml': contextService.getModelStr(),
            'xform': contextService.getXform()
        });
    };

    this.getUrlsToAddChildren = function() {
        return contextService.getUrlsToAddChildren();;
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
        });
    };

    var onNew = function(submission) {
        submission.status = "modified";
        submission.project_uuid = projectUuid;
        submissionDao.createSubmission(submission).then(function() {
            msg.displaySuccess('Saved');
            var goToSubmissionList = function() {
                $location.url('/submission-list/' + (parentUuid? parentUuid : projectUuid) + '?type=all');
            }
            var reload = function() {
                $route.reload();
            }
            dialogService.confirmBox("Do you want to create another one?", reload, goToSubmissionList);
        }, function(error) {
            console.log(error);
        });
    };
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

    var onDelete = function(submission) {
         dialogService.confirmBox(resourceBundle.confirm_data_delete, function() {
            submissionDao.deleteSubmissions([$scope.submission.submission_id]).then(function(){
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
        submissionDao.getSubmissionById($scope.submission.submission_id)
                    .then(dcsService.postSubmissionAndPurgeObsoluteMedia)
                    .then(dcsService.postSubmissionNewMedia)
                .then(submissionDao.updateSubmission)
                    .then(function() {
                        if($scope.page.isLastPage())
                            app.goBack();
                        else {
                            "done".showInfo();
                            $scope.page.onNext();
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
                $scope.submission = result && result.data[0];
                addPagination(type, searchStr, currentIndex, result && result.total);
                enketoService.loadEnketo(project, $scope.submission);
                if($routeParams.currentIndex)
                        loadActions();
                $scope.urlsToAddChildren = enketoService.getUrlsToAddChildren();
            });
        });
    };

    loadSubmission();

    app.goBack = function() {
        $location.url('/submission-list/' + $routeParams.project_uuid + '?type=' + type);
    };
}]);
