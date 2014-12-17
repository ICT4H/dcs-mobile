var serverProjectListController = function($rootScope, $scope, dcsService, localStore, msg, app, paginationService) {
    resourceBundle = $rootScope.resourceBundle;
    $scope.pagination = paginationService.pagination;
    $scope.actions = {};

    var selectedProject = [];

    var assignProjects = function(projects) {
        $scope.pagination.totalElement = projects.total;
        $scope.projects = projects.projects;
        msg.hideAll();
    };

    var ErrorLoadingProjects = function(data, error) {
        msg.hideLoadingWithErr('Failed to fetch projects');
    };

    var fetchProjects  = function() {
        msg.showLoadingWithInfo(resourceBundle.fetching_projects);
        dcsService.getProjects($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
            .then(assignProjects, ErrorLoadingProjects);
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

    var initActions =  function() {
        $scope.actions['download'] = {'onClick': onDownloadProject, 'label': 'Download' };
    };

    $scope.onProjectSelect = function(projectRow, project) {
        projectRow.selected = !projectRow.selected;
        app.flipArrayElement(selectedProject, project.project_uuid);
    };

    var onLoad = function() {
        $scope.pagination.init($rootScope.pageSize.value, 0, fetchProjects);
        fetchProjects();
        initActions();
    };

    onLoad();
};

dcsApp.controller('serverProjectListController', ['$rootScope', '$scope', 'dcsService', 'projectDao', 'messageService', 'app', 'paginationService', serverProjectListController]);
