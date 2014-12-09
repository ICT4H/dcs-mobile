var serverProjectListController = function($rootScope, $scope, dcsService, localStore, msg, contextService) {
    $scope.pagination = contextService.pagination;

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

    var onLoad = function() {
        $scope.pagination.init($rootScope.pageSize.value, 0, fetchProjects);
        fetchProjects();
    };

    onLoad();

    $scope.downloadProject = function(project) {
        msg.showLoadingWithInfo('Downloading project');
        dcsService.getQuestion(project.project_uuid)
            .then(localStore.createProject)
            .then(function() {
                msg.hideLoadingWithInfo('Project downloaded.');
            }, function(error) {
                msg.hideLoadingWithInfo('this project is already downloaded.');
            });
    };
};

dcsApp.controller('serverProjectListController', ['$rootScope', '$scope', 'dcsService', 'projectDao', 'messageService', 'contextService', serverProjectListController]);
