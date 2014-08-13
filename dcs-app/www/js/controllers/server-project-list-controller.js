dcsApp.controller('serverProjectListController', ['$rootScope', '$scope', 'dcsService', 'localStore', 'messageService', function($rootScope, $scope, dcsService, localStore, msg) {

    $scope.pageTitle = $rootScope.title + ' - Projects';
    $scope.pageSize = 5;
    $scope.pageSizes = [5, 10, 15, 20];

    var assignProjects = function(projects) {
        $scope.total = projects.total;
        $scope.projects = projects.projects;
        msg.hideAll();
    };

    var ErrorLoadingProjects = function(data,error) {
        msg.hideLoadingWithErr(error+' Failed to fetch projects');
    };

    var fetchProjects  = function(pageNumber) {
        $scope.pageNumber = pageNumber;
        msg.showLoadingWithInfo(resourceBundle.fetching_projects);
        dcsService.getProjects(pageNumber * $scope.pageSize.value, $scope.pageSize.value)
        .then(assignProjects, ErrorLoadingProjects);
    };

    $scope.onLoad = function() {
        $scope.pageSize = {'value':$scope.pageSizes[0]};
        fetchProjects(0);
    };

    $scope.onNext = function(pageNumber) {
        if(pageNumber * $scope.pageSize.value < $scope.total)
            fetchProjects(pageNumber);
    };

   $scope.onPrevious = function(pageNumber) {
        if (pageNumber >= 0) 
            fetchProjects(pageNumber);
    };

    $scope.onPageSizeChange = function() {
        fetchProjects(0);
    };

    $scope.onLoad();

    $scope.downloadProject = function(project) {
        msg.showLoadingWithInfo('Downloading project');
        dcsService.getQuestion(project.project_uuid)
        .then(localStore.createProject)
        .then(function() {      
            msg.hideLoadingWithInfo('Project downloaded.');
        }, function(error) {
            msg.hideLoadingWithInfo('this project is allready downloaded.');
        });
    };
}]);
