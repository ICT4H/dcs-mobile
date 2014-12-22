var localProjectListController = function($rootScope, app, $scope, $q, $location, dcsService, paginationService, projectDao, msg) {

    resourceBundle = $rootScope.resourceBundle;
    $scope.pagination = paginationService.pagination;
    $scope.projects = [];
    $scope.actions = {};

    // private variable
    var selectedProject = [];

    var assignProjects = function(projects) {
        $scope.projects = projects;
    };

    var ErrorLoadingProjects = function(data,error) {
        msg.hideLoadingWithErr('Failed to load projects');
    };

    var loadProjects  = function(pageNumber) {
        msg.showLoadingWithInfo(resourceBundle.loading_projects);
        projectDao.
            getProjects($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                .then(assignProjects, ErrorLoadingProjects);
        
        msg.hideAll();
    };

    var assignServerProjects = function(projects) {
        $scope.pagination.totalElement = projects.total;
        $scope.projects = projects.projects;
        msg.hideAll();
    };

    var ErrorLoadingServerProjects = function(data, error) {
        msg.hideLoadingWithErr('Failed to fetch projects');
    };

    var fetchProjects  = function() {
        msg.showLoadingWithInfo(resourceBundle.fetching_projects);
        dcsService.getProjects($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
            .then(assignServerProjects, ErrorLoadingServerProjects);
    };
    
    var onNew = function() {
        fetchProjects();
        initServerActions();
    };

    var onDelete = function(){
        if(app.areItemSelected(selectedProject)) {
            function onConfirm(buttonIndex) {
                if(buttonIndex!=BUTTON_NO){
                    projectDao.deleteProject(selectedProject[0]).then(function(response) {
                        loadProjects($scope.pageNumber);
                        msg.hideLoadingWithInfo(resourceBundle.project_deleted);
                    }, function(error) {
                        msg.handleError(error, resourceBundle.project_delete_error);
                    });
                }
            };
            navigator.notification.confirm(
                'Do you want to delete "' + selectedProject[0].name + '"?',
                onConfirm,
                'Delete project',
                ['Yes','No']
            );
        }
    };

    var onUpdate = function() {
        if(selectedProject.length ==0) {
            projectDao.getAll().then(function(projects){
                updateProjects(projects);
            });
        }
        else {
            updateProjects(selectedProject);
        }
    };

    var onDownloadProject = function() {
        if(app.areItemSelected(selectedProject)) {
            msg.showLoadingWithInfo('Downloading projects');
            dcsService.getQuestion(selectedProject)
            .then(localStore.createProject)
            .then(function() {
                msg.hideLoadingWithInfo('Project downloaded.');
            }, function(error) {
                msg.hideLoadingWithInfo('this project is already downloaded.');
            });
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
        msg.hideLoadingWithInfo('updated project list');
        loadProjects(0);
        },function() {
            msg.hideLoadingWithErr('projects not updated properly');
        });
    };
    
    var initLocalActions =  function() {
        $scope.actions = {};
        $scope.actions['delete'] = {'onClick': onDelete, 'label': 'Delete' };
        $scope.actions['update'] = {'onClick': onUpdate, 'label': 'Update'};
        $scope.actions['new'] = {'onClick': onNew, 'label': 'Get new survey'};
    };

    var initServerActions =  function() {
        $scope.actions = {};
        $scope.actions['download'] = {'onClick': onDownloadProject, 'label': 'Download' };
    };

    var onLoad = function() {
        $scope.pagination.init($rootScope.pageSize.value, 0, loadProjects);
        initLocalActions();
        projectDao.getCountOfProjects().then(function(result){
            if(result.total == 0) return;
            $scope.pagination.totalElement = result.total;
            loadProjects(0);
        });
    };

    onLoad();
    
    $scope.onProjectSelect = function(projectRow, project) {
        projectRow.selected = !projectRow.selected;
        app.flipArrayElement(selectedProject, project.project_uuid);
    };

    
};

dcsApp.controller('localProjectListController', ['$rootScope', 'app', '$scope', '$q', '$location', 'dcsService', 'paginationService', 'projectDao', 'messageService', localProjectListController]);
