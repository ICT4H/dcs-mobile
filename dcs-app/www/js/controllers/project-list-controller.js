var localProjectListController = function($rootScope, app, $scope, $q, $location, dcsService, paginationService, projectDao, msg, dialogService) {

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
        selectedProject = [];
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            $scope.serverPage = false;
            (501).showInfo();
            initOfflineActionItems();
            projectDao.
                getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignResult, (103).showError);
        });
    };

    var loadServer = function() {
        selectedProject = [];
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            $scope.serverPage = true;
            (501).showInfo();
            initOnlineActionItems();
            dcsService.
                getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignResult, (103).showError);
        });
    };

    var onDownloadProject = function() {
        if(!app.areItemSelected(selectedProject)) return;

        "downloading_projects".showInfo();
        dcsService.getQuestionnaires(selectedProject)
        .then(function(projects) {
            app.mapPromise(projects, projectDao.createProject)
                .then( function(response) {
                loadLocal();
                (504).showInfo();
            }, (104).showError);  
        }, (105).showError);
    };

    var initOnlineActionItems = function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onDownloadProject, 'label': resourceBundle.download });
        document.addEventListener('backbutton', loadLocal, false);
        $scope.title = resourceBundle.serverProjectTitle;
    };

    var onDelete = function(){
        if(app.areItemSelected(selectedProject)) {
            dialogService.confirmBox('Do you want to delete selected projects?', function() {
                projectDao.deleteProject(selectedProject)
                .then(function(response) {
                        loadLocal();
                        (504).showInfo();
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
            dialogService.confirmBox('Do you want to update all projects?', function() {
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
        });
    };

    var initOfflineActionItems = function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onDelete, 'label': resourceBundle.delete });
        $scope.actions.push({'onClick': onUpdate, 'label': resourceBundle.update });
        $scope.actions.push({'onClick': loadServer, 'label': resourceBundle.getNewSurvey });
        $scope.title = resourceBundle.localProjectTitle;
    };

    $scope.search = function(searchStr) {
        selectedProject = [];
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            $scope.serverPage = false;
            (501).showInfo();
            initOfflineActionItems();
            projectDao.
                getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize, searchStr)
                    .then(assignResult, (103).showError);
        });
    };

    $scope.flipSearch = function() {
        $scope.showSearch = !$scope.showSearch;
    }

    $scope.disableLink = function(status) {
        return status=='server-deleted' || status=='outdated';
    };

    $scope.showAllSubmissions = function(project) {
        $location.url('/submission-list/' + project.project_uuid + '?type=all');
    }

    $scope.onProjectSelect = function(projectRow, project) {
        projectRow.selected = !projectRow.selected;
        app.flipArrayElement(selectedProject, project.project_uuid);
    };

    $scope.showUnsubmitted = function(project) {
        $location.url('/submission-list/' + project.project_uuid + '?type=unsubmitted');
    };

    loadLocal();
};

dcsApp.controller('localProjectListController', ['$rootScope', 'app', '$scope', '$q', '$location', 'dcsService', 'paginationService', 'projectDao', 'messageService', 'dialogService', localProjectListController]);
