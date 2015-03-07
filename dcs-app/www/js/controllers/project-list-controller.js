var localProjectListController = function($rootScope, app, $scope, $q, $location, dcsService, paginationService, projectDao, msg, dialogService, contextService) {

    resourceBundle = $rootScope.resourceBundle;
    $scope.pagination = paginationService.pagination;
    $scope.projects = [];
    $scope.actions = [];
    $scope.title = "";
    $scope.showSearch = false;

    // private variable
    var selectedProject = [];

    var assignResult = function(result) {   
        $scope.projects = result.projects;
        $scope.pagination.totalElement = result.total;
        msg.hideAll();
    };

    var loadLocal = function() {
        $scope.showBack = false;
        selectedProject = [];
        $scope.projects = [];
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            $scope.serverPage = false;
            "loading_forms".showInfo();
            initOfflineActionItems();
            projectDao.
                getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignResult, "error_loading_forms".showError);
        });
    };

    var loadServer = function() {
        $scope.showBack = true;
        selectedProject = [];
        $scope.projects = [];
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            $scope.serverPage = true;
            "loading_forms".showInfoWithLoading();
            $scope.initOnlineActionItems();
            dcsService.
                getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignResult, function() {
                        msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
                    });
        });
    };

    var onDownloadProject = function() {
        if(!app.areItemSelected(selectedProject)) return;

        "downloading_projects".showInfoWithLoading();
        _getNonExistingProjectUuids(selectedProject)
            .then(_downloadServerProject)
            .then(_downloadNonExistingParent)
            .then(_createUniqueLocalProjects);
    };

    var _getNonExistingProjectUuids = function(projectUuids) {
        var deferred = $q.defer();
        projectDao.getProjectByUuids(projectUuids).then(function(projects) {
            var existingProjectUuids = $scope.pluck(projects, 'project_uuid');
            var nonExisingProjectUuids = $scope.difference(projectUuids, existingProjectUuids);
            if (nonExisingProjectUuids.length > 0)
                deferred.resolve(nonExisingProjectUuids);
            else
                'project_exists_locally'.showInfo();
                deferred.reject();
        });
        return deferred.promise;
    }

    /*
    Failure is handled by reporting to UI and by rejecting promise
    */
    var _downloadServerProject = function(projectUuids) {
        if (projectUuids.length < 1) return $q.when([]);
        var deferred = $q.defer();
        dcsService.getQuestionnaires(projectUuids).then(function(serverProjects) {
            deferred.resolve(serverProjects);
        }, function(serverError) {
            'error_downloading_projects'.showError();
            deferred.reject();
        });
        return deferred.promise;
    };

    var _downloadNonExistingParent = function(serverProjects) {
        var parentUuids = getParentProjectUuids(serverProjects);
        if (parentUuids.length === 0) return $q.when(serverProjects);

        var deferred = $q.defer();
        projectDao.getProjectByUuids(parentUuids).then(function(projects) {
            var existingProjectUuids = $scope.pluck(projects, 'project_uuid');
            var nonExisingProjectUuids = $scope.difference(parentUuids, existingProjectUuids);

            _downloadServerProject(nonExisingProjectUuids).then(function(serverParentProjects) {
                deferred.resolve(serverProjects.concat(serverParentProjects));
            });
        });
        return deferred.promise;
    }

    var _excludeDuplicateParents = function(serverProjects, parentUuids) {
        return $scope.chain(serverProjects)
                    .pluck('project_uuid')
                    .uniq(parentUuids).value();
    }

    var _createUniqueLocalProjects = function(projects) {
        var uniqueProjects = $scope.uniq(projects, $scope.iteratee('project_uuid'));
        app.mapPromise(uniqueProjects, projectDao.createProject).then( function(response) {
            loadLocal();
            'project_downloaded'.showInfo();
        }, ''.showError.bind('error_saving_project'));
    }


    var getParentProjectUuids = function(projects) {
        return $scope.chain(projects)
            .where({'project_type': 'child'})
            .pluck('parent_info')
            .pluck('parent_uuid').value();
    }

    $scope.initOnlineActionItems = function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onDownloadProject, 'label': resourceBundle.download });
        document.addEventListener('backbutton', loadLocal, false);
        $scope.title = resourceBundle.serverProjectTitle;
    };

    var onDelete = function(){
        if(app.areItemSelected(selectedProject)) {
            dialogService.confirmBox('Delete Selected Forms?', function() {
                projectDao.deleteSub(selectedProject).then(function(response) {
                    projectDao.deleteProject(selectedProject).then(function(response) {
                        loadLocal();
                        (504).showInfo();
                    }, (106).showError);
                }, (106).showError);
            });
        }
    };

    var onUpdate = function() {
        if(selectedProject.length != 0) {
            projectDao.getProjectsforUpdate(selectedProject).then(function(projects) {
                updateProjects(projects);
            });
        }
        else {
            dialogService.confirmBox('Refresh Status of all Forms?', function() {
                projectDao.getAll().then(function(projects){
                  updateProjects(projects);
                });
            });
        }
    };

    var updateProjects  = function(projects) {
        msg.showLoading();
        dcsService.checkProjectsStatus(projects).then(function(outdatedProjects){
            if(outdatedProjects.length == 0) {
                "no_project_change".showInfo();
                return;                
            }

            var promises = [];
            outdatedProjects.forEach(function(outdatedProject) {
                promises.push(projectDao.setprojectStatus(outdatedProject.id, outdatedProject.status)); 
            });
            $q.all(promises).then(function() {
                loadLocal();
                (505).showInfo();
            }, (107).showError);
        }, function(error, status) {
            msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
        });
    };

    var initOfflineActionItems = function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': loadServer, 'label': resourceBundle.download_forms });
        $scope.actions.push({'onClick': onDelete, 'label': resourceBundle.delete });
        $scope.actions.push({'onClick': onUpdate, 'label': resourceBundle.refresh_status });
        $scope.title = resourceBundle.localProjectTitle;
    };

    $scope.search = function(searchStr) {
        selectedProject = [];
        if($scope.serverPage) 
            $scope.pagination.init($rootScope.pageSize.value, 0, function() {
                $scope.serverPage = false;
                "loading_forms".showInfo();
                initOfflineActionItems();
                dcsService.
                    getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize, searchStr)
                        .then(assignResult, "error_loading_forms".showError);
            });
        else
            $scope.pagination.init($rootScope.pageSize.value, 0, function() {
                $scope.serverPage = false;
                "loading_forms".showInfo();
                initOfflineActionItems();
                projectDao.
                    getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize, searchStr)
                        .then(assignResult, "error_loading_forms".showError);
            });
    };

    $scope.flipSearch = function() {
        $scope.showSearch = !$scope.showSearch;
    }

    $scope.disableLink = function(status) {
        return status=='server-deleted' || status=='outdated';
    };

    $scope.showAllSubmissions = function(project) {
        contextService.setProject(project);
        $location.url('/submission-list/' + project.project_uuid + '?type=all');
    }

    $scope.createSurveyResponse = function(project_uuid) {
        $location.path('/projects/' + project_uuid + '/submissions/new');
    };

    $scope.onProjectSelect = function(projectRow, project) {
        projectRow.selected = !projectRow.selected;
        app.flipArrayElement(selectedProject, project.project_uuid);
    };

    $scope.showUnsubmitted = function(project) {
        contextService.setProject(project);
        $location.url('/submission-list/' + project.project_uuid + '?type=unsubmitted');
    };
    
    $scope.onSearchClose = function(searchStr) {
        $scope.search('');
    };

    app.goBack = function() {
        if($scope.showSearch) {
            $scope.showSearch = false;
            $scope.search('');
        }
        else if($scope.serverPage)
            loadLocal();
        else
            dialogService.confirmBox("Do you want to exit?", function() {
                    navigator.app.exitApp();
            }, function() {});
    };

    loadLocal();
};

dcsApp.controller('localProjectListController', ['$rootScope', 'app', '$scope', '$q', '$location', 'dcsService', 'paginationService', 'projectDao', 'messageService', 'dialogService', 'contextService', localProjectListController]);
