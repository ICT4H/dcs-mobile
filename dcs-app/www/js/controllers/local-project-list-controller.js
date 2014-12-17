var localProjectListController = function($rootScope, app, $scope, $q, $location, dcsService, contextService, projectDao, msg) {

    resourceBundle = $rootScope.resourceBundle;
    $scope.createSurveyResponse = contextService.createSurveyResponse;
    $scope.isProjectOutdated = contextService.isProjectOutdated;
    $scope.pagination = contextService.pagination;
    $scope.projects = [];
    $scope.actions = {};
    $scope.projectRowStyle = [];

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

    var onNew = function() {
        $location.path('/server-project-list');
    };

    var areItemSelected = function() {
        if(selectedProject.length ==0) {
            navigator.notification.alert('You need to select atleast one item.', function() {}, "Garner");
            return false;
        }
        return true;
    };

    var onDelete = function(project){
        if(areItemSelected()) {
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
                'Do you want to delete "' + project.name + '"?',
                onConfirm,
                'Delete project',
                ['Yes','No']
            );
        }
    };
    
    var initActions =  function() {
        $scope.actions['delete'] = {'onClick': onDelete, 'label': 'Delete' };
        $scope.actions['update'] = {'onClick': onNew, 'label': 'Update'};
        $scope.actions['new'] = {'onClick': onNew, 'label': 'Get new survey'};

    };

    var onLoad = function() {
        $scope.pagination.init($rootScope.pageSize.value, 0, loadProjects);
        initActions();
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
        initActions();
    };

    $scope.$sync = function() {
        msg.showLoading();
        var promises = [];

        projectDao.getAll().then(function(projects){ 
            promises.push(dcsService.checkProjectsStatus(projects).then(function(outdatedProjects){
                outdatedProjects.forEach(function(outdatedProject) {
                    promises.push(projectDao.setprojectStatus(outdatedProject.id, outdatedProject.status)); 
                });
            }));
            $q.all(promises).then(function() {
            msg.hideLoadingWithInfo('updated project list');
            $scope.pageSizes.push($scope.total);
             loadProjects(0);
            },function() {
                msg.hideLoadingWithErr('projects not updated properly');
            });
        });
    };
};

dcsApp.controller('localProjectListController', ['$rootScope', 'app', '$scope', '$q', '$location', 'dcsService', 'contextService', 'projectDao', 'messageService', localProjectListController]);
