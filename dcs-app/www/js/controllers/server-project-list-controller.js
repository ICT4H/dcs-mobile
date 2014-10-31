dcsApp.controller('serverProjectListController', ['$rootScope', '$scope', 'dcsService', 'projectDao', 'messageService', function($rootScope, $scope, dcsService, localStore, msg) {

    $scope.pageSize = $rootScope.pageSize.value;
    $scope.pageSizes = $rootScope.pageSizes;
    $scope.total = 0;
    $scope.Math = window.Math;

    var assignProjects = function(projects) {
        $scope.total = projects.total;
        $scope.projects = projects.projects;
        msg.hideAll();
    };

    var ErrorLoadingProjects = function(data, error) {
        msg.hideLoadingWithErr('Failed to fetch projects');
    };

    var fetchProjects  = function(pageNumber) {
        $scope.pageNumber = pageNumber;
        msg.showLoadingWithInfo(resourceBundle.fetching_projects);
        dcsService.getProjects(pageNumber * $scope.pageSize, $scope.pageSize)
        .then(assignProjects, ErrorLoadingProjects);
    };

    var onLoad = function() {
        fetchProjects(0);
    };

    $scope.onNext = function(pageNumber) {
        fetchProjects(pageNumber);
    };

    $scope.onPrevious = function(pageNumber) {
        fetchProjects(pageNumber);
    };

    $scope.isLastPage = function() {
        return Math.ceil($scope.total/$scope.pageSize) == $scope.pageNumber + 1;
    };

    $scope.isFirstPage = function() {
        return $scope.pageNumber == 0;
    };

    $scope.isAtLast = function() {
        if($scope.isLastPage())
            return $scope.listIndex ==  $scope.total % $scope.pageSize - 1 ;
        return $scope.listIndex == $scope.pageSize-1;
    }

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
}]);
