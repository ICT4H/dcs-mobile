var localProjectListController = function($rootScope, app, $scope, $q, $location, dcsService, paginationService, projectDao, msg, dialogService) {

    resourceBundle = $rootScope.resourceBundle;
    $scope.pagination = paginationService.pagination;
    $scope.projects = [];
    $scope.actions = {};
    $scope.title = "";
    // private variable
    var selectedProject = [];

    var assignResult = function(result) {
        $scope.projects = result.projects;
        $scope.pagination.totalElement = result.total;
        msg.hideAll();
    };

    var loadLocal = function() {
        $scope.serverPage = false;
        (501).showInfo();
        initOfflineActionItems();
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            projectDao.
                getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignResult, (103).showError);
        });
    };

    var loadServer = function() {
        $scope.serverPage = true;
        (501).showInfo();
        initOnlineActionItems();
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            dcsService.
                getProjectsList($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignResult, (103).showError);
        });
    };

    var onDownloadProject = function() {
        if(app.areItemSelected(selectedProject)) {
            (502).showInfo();
            dcsService.getQuestionnaires(selectedProject)
            .then(function(projects) {
                app.mapPromise(projects, projectDao.createProject)
                    .then( function(response) {
                        loadLocal();
                        (504).showInfo();
                    }, (104).showError);  
            }, (105).showError);
        }
    };

    var initOnlineActionItems = function() {
        $scope.actions = {};
        $scope.actions['download'] = {'onClick': onDownloadProject, 'label': resourceBundle.download };
        document.addEventListener('backbutton', loadLocal, false);
        $scope.title = resourceBundle.serverProjectTitle;
    };

    var onDelete = function(){
        if(app.areItemSelected(selectedProject)) {
            dialogService.confirmBox('Do you want to delete selected projects?', function() {
                projectDao.deleteProject(selectedProject[0])
                .then(function(response) {
                        loadLocal();
                        (504).showInfo();
                    }, (106).showError);
            });
        }
    };

    var onUpdate = function() {
        if(selectedProject.length == 0) {
            projectDao.getAll().then(function(projects){
                updateProjects(projects);
            });
        } else {
            updateProjects(selectedProject);
        }
    };

    var updateProjects  = function(projects) {
        msg.showLoading();
        var promises = [];
        promises.push(dcsService.checkProjectsStatus(projects).then(function(outdatedProjects){
            outdatedProjects.forEach(function(outdatedProject) {
                promises.push(projectDao.setprojectStatus(outdatedProject.id, outdatedProject.status)); 
            });
        }));
        $q.all(promises).then(function() {
            loadLocal();
            (505).showInfo();
        }, (107).showError);
    };

    var initOfflineActionItems = function() {
        $scope.actions = {};
        $scope.actions['delete'] = {'onClick': onDelete, 'label': resourceBundle.delete };
        $scope.actions['update'] = {'onClick': onUpdate, 'label': resourceBundle.update };
        $scope.actions['new'] = {'onClick': loadServer, 'label': resourceBundle.getNewSurvey };
        $scope.title = resourceBundle.localProjectTitle;
    };

    $scope.onProjectSelect = function(projectRow, project) {
        projectRow.selected = !projectRow.selected;
        app.flipArrayElement(selectedProject, project.project_uuid);
    };

    loadLocal();
};

dcsApp.controller('localProjectListController', ['$rootScope', 'app', '$scope', '$q', '$location', 'dcsService', 'paginationService', 'projectDao', 'messageService', 'dialogService', localProjectListController]);
