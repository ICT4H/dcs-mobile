var localProjectListController = function($rootScope, app, $scope, $q, $location, dcsService, paginationService, projectDao, msg, dialogService, contextService, submissionService) {

    resourceBundle = $rootScope.resourceBundle;
    $scope.pagination = paginationService.pagination;
    $scope.projects = [];
    $scope.actions = [];
    $scope.title = "";

    var selectedServerProjects = [];

    loadLocal();

    app.goBack = function() {
        if($scope.serverPage)
            loadLocal();
        else {
            dialogService.confirmBox('Do you want to exit?', function() {
                navigator.app.exitApp();
            });
        }
    };

    $scope.loadServer = function() {
        $scope.showBack = true;
        selectedServerProjects = [];
        $scope.projects = [];
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            $scope.serverPage = true;
            'loading_forms'.showInfoWithLoading();
            initServerActionItems();
            dcsService.
                getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignResult, function() {
                        msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
                    });
        });
    }

    $scope.onProjectSelect = function(projectRow, project) {
        projectRow.selected = !projectRow.selected;
        app.flipArrayElement(selectedServerProjects, project.project_uuid);
    };

    $scope.onDeleteProjectByUuid = function(projectUuid){
        dialogService.confirmBox(resourceBundle.confirm_form_delete, function() {
            deleteProjectsByUuids([projectUuid]);
            fileSystem.deleteUserFolders(app.user.name, selectedServerProjects);
        });
    };

    $scope.refreshByUuid = function(project) {
        if (project.project_type == 'child') {
            updateProjectAndParent(project);
        } else {
            var requestProject = getRequest(project);
            updateProjects([requestProject]);
        }
    }

    $scope.forceRefreshByProjectUuid = function(projectUuid) {
        dialogService.confirmBox(resourceBundle.form_outdated, function() {
            'downloading_projects'.showInfoWithLoading();
            projectDao.deleteSub([projectUuid]).then(function(response) {
                projectDao.deleteProject([projectUuid]).then(function(response) {
                    downloadServerProject([projectUuid])
                        .then(downloadNonExistingParent)
                        .then(createUniqueLocalProjects)
                        .then(loadLocal);
                }, onErrorDeleting);
            }, onErrorDeleting);
        });
    }

    $scope.onShowAllSubmissions = function(project) {
        contextService.setProject(project);
        $location.url('/submission-list/' + project.project_uuid + '?type=all');
    }

    $scope.onNewSurveyResponse = function(project) {
        if (project.project_type == 'child') {
            var parentProject = $scope.findWhere($scope.projects, {'project_uuid': project.parent_uuid});
            contextService.setParentAndChildProjects(parentProject, project);
            var parent_uuid = project.parent_uuid;
            $location.url('/submission-list/' + parent_uuid + '?type=all&fromChild=true');
       } else {
            contextService.setProject(project);
            $location.path('/projects/' + project.project_uuid + '/submissions/new');
        }
    };

    $scope.submitUnsubmitted = function(project) {
        msg.showLoading();
        contextService.setProject(project);
        submissionService.submitAllOrSelectedIds(project.project_uuid).then(loadLocal, errorSubmitting);
    };

    function initOfflineActionItems() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onRefreshAll, 'icon': 'fa-refresh', 'label': resourceBundle.refresh_all});
        $scope.title = resourceBundle.localProjectTitle;
    };

    function initServerActionItems() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onDownloadProject, 'icon': 'fa-download' });
        document.addEventListener('backbutton', loadLocal, false);
        $scope.title = resourceBundle.serverProjectTitle;
    };

    function onRefreshAll() {
        dialogService.confirmBox(resourceBundle.refresh_all_forms, function() {
            projectDao.getAll().then(function(projects) {
              updateProjects(projects);
            });
        });
    }

    function updateProjectAndParent(project) {
        var requestProject = getRequest(project);
        projectDao.getProjectToRefresh(project.parent_uuid).then(function(parents) {
            var parentProjectRequest = getRequest(parents[0]);
            updateProjects([requestProject, parentProjectRequest]);
        });
    }

    function getRequest(project) {
        return {'project_uuid': project.project_uuid, 'version': project.version, 'project_type': project.project_type};
    }

    function updateProjects(projects) {
        msg.showLoading();
        dcsService.checkProjectsStatus(projects).then(function(response) {
            var promises = [];

            promises.push(setProjectsLastUpdateAsync(projects, response.last_updated));

            resetAllAssignedProjects(response, promises)

            addOutdatedStatusUpdationPromise(response, promises);

            promises.push(downloadDataOfParents(projects));

            $q.all(promises).then(function() {
                loadLocal();
            }, ''.showError.bind('updation_failed'));
        }, function(error, status) {
            msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
        });
    }

    function resetAllAssignedProjects(response, promises) {
        promises.push(projectDao.resetAllAssignedProjects(response.unassign_uuids));
    }

    function setProjectsLastUpdateAsync(projects, lastUpdated) {
        var isSingleProjectSelected = projects.length == 1;
        if (isSingleProjectSelected)
            return projectDao.setProjectUpdated(projects[0].project_uuid, lastUpdated);
        else
            return projectDao.setAllProjectUpdatedTo(lastUpdated);
    }

    function addOutdatedStatusUpdationPromise(response, promises) {
        response.outdated_projects.forEach(function (outdatedProject) {
            promises.push(projectDao.setProjectStatus(outdatedProject.project_uuid, outdatedProject.status));
        });
    }

    function onDownloadProject() {
        if(!app.areItemSelected(selectedServerProjects)) return;

        'downloading_projects'.showInfoWithLoading();
        getNonExistingProjectUuids(selectedServerProjects)
            .then(downloadServerProject)
            .then(downloadNonExistingParent)
            .then(createUniqueLocalProjects)
            .then(downloadDataOfParents)
            .then(loadLocal);
    }

    function getNonExistingProjectUuids(projectUuids) {
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

    function downloadServerProject(projectUuids) {
        if (projectUuids.length < 1) return $q.when([]);

        var deferred = $q.defer();
        dcsService.getQuestionnaires(projectUuids).then(function(serverProjects) {
            deferred.resolve(serverProjects);
        }, function(serverError) {
            'error_downloading_projects'.showError();
            deferred.reject();
        });
        return deferred.promise;
    }

    function downloadNonExistingParent(serverProjects) {
        var parentUuids = getParentProjectUuids(serverProjects);
        if (parentUuids.length === 0) return $q.when(serverProjects);

        var deferred = $q.defer();
        projectDao.getProjectByUuids(parentUuids).then(function(projects) {
            var existingProjectUuids = $scope.pluck(projects, 'project_uuid');
            var nonExisingProjectUuids = $scope.difference(parentUuids, existingProjectUuids);

            downloadServerProject(nonExisingProjectUuids).then(function(serverParentProjects) {
                deferred.resolve(serverProjects.concat(serverParentProjects));
            });
        });
        return deferred.promise;
    }

    function createUniqueLocalProjects(projects) {
        var uniqueProjects = $scope.uniq(projects, $scope.iteratee('project_uuid'));
        var deferred = $q.defer();

        $q.all(uniqueProjects.map(function(uniqueProject) {
            return projectDao.createProject(uniqueProject);
        })).then(function() {
            console.log('create uniq prj done');
            deferred.resolve(uniqueProjects);
        }, function() {
            deferred.reject();
            ''.showError.bind('error_saving_project');
        });

        return deferred.promise;
    }

    function downloadDataOfParents(projects) {
        console.log('downloading parent data');
        return $q.all(projects.map(function(project) {
            if (project.project_type == 'parent')
                return submissionService.processDeltaSubmissionsWithoutMedia(project.project_uuid);
            else
                return $q.when();
        }));
    }

    function assignResult(result) {
        $scope.projects = result.projects;
        $scope.pagination.totalElement = result.total;
        msg.hideAll();
    }

    function getParentProjectUuids(projects) {
        return $scope.chain(projects)
            .where({'project_type': 'child'})
            .pluck('parent_info')
            .pluck('parent_uuid').value();
    }

    function onErrorDeleting() {
        'cannot_delete_form'.showError();
    }

    function errorSubmitting() {
        msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
    }

    function deleteProjectsByUuids(projectUuids) {
        projectDao.deleteSub(projectUuids).then(function(response) {
            projectDao.deleteProject(projectUuids).then(function(response) {
                loadLocal();
            }, onErrorDeleting);
        }, onErrorDeleting);
    }

    function loadLocal() {
        $scope.showBack = false;
        selectedServerProjects = [];
        $scope.projects = [];
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            $scope.serverPage = false;
            'loading_forms'.showInfo();
            initOfflineActionItems();
            projectDao.
                getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignResult, 'error_loading_forms'.showError);
        });
    }
};

dcsApp.controller('localProjectListController', ['$rootScope', 'app', '$scope', '$q', '$location', 'dcsService', 'paginationService', 'projectDao', 'messageService', 'dialogService', 'contextService', 'submissionService', localProjectListController]);
