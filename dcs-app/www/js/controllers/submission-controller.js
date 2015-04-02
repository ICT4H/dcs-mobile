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
    var currentlyViewedSubId;

    loadSubmission();

    function loadSubmission() {
        var project = contextService.getProject();
        getSubmissionByCurrentIndex(project.project_uuid, type, searchStr, currentIndex).then(function(result) {
            var mayBeSubmission = result && result.data[0];
            contextService.setSubmission(mayBeSubmission);
            currentlyViewedSubId = mayBeSubmission && mayBeSubmission.submission_id;
            addPagination(type, searchStr, currentIndex, result && result.total);
            enketoService.loadEnketo(project, mayBeSubmission);
            addActions(project);
        });
    };

    function addActions(currentProject) {
        $scope.actions = [];
        var isEdit = $routeParams.currentIndex? true: false;
        if( contextService.isParentProject() ) {
            setTitlesAndParentSelectAction();
        } else if( isEdit ) {
            $scope.actions.push({'onClick': onDelete, 'label': resourceBundle.delete});
            $scope.actions.push({'onClick': onSubmit, 'label': resourceBundle.submit});
        }
    };

    function addPagination(type, searchStr, currentIndex, total) {
        singleItemPage.init($routeParams.project_uuid, type, searchStr, currentIndex, total);
    }

    function getSubmissionByCurrentIndex(project_uuid, type, searchStr, currentIndex) {
        if (isNaN(currentIndex)) return $.when();

        return submissionDao.searchSubmissionsByType(project_uuid, type, searchStr, currentIndex, 1)
    }

    function onDelete(submission) {
         dialogService.confirmBox(resourceBundle.confirm_data_delete, function() {
            submissionDao.deleteSubmissions([currentlyViewedSubId]).then(function() {
                var submissionFolder = $routeParams.project_uuid + '/' + currentlyViewedSubId;
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

    function onSubmit() {
        "data_submit_msg".showInfoWithLoading();
        submissionDao.getSubmissionById(currentlyViewedSubId)
            .then(dcsService.postSubmissionAndPurgeObsoluteMedia)
            .then(dcsService.postSubmissionNewMedia)
            .then(submissionDao.updateSubmission)
            .then(function() {
                navigatePostSubmit();
            }, function() {
                msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
            });
    };

    function navigatePostSubmit() {
        if($scope.page.isLastPage())
            app.goBack();
        else {
            "done".showInfo();
            loadSubmission();
        }
    }

    function setTitlesAndParentSelectAction() {
        var childProject = contextService.getChildProject();
        var childProjectName = childProject.name;
        $scope.title = '';
        $scope.subTitle = 'Create new ' + childProjectName + ' using';

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

    app.goBack = function() {
        $location.url('/submission-list/' + $routeParams.project_uuid + '?type=' + type);
    };

}]);
