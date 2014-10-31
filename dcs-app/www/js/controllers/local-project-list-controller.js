var localProjectListController = function($rootScope, $scope, $q, dcsService, projectDao, msg) {

    resourceBundle = $rootScope.resourceBundle;
    $scope.pageSizes = $rootScope.pageSizes;
    $scope.pageSize = $rootScope.pageSize.value;
    $scope.total = 0;
    $scope.pageNumber = 0;
    $scope.Math = window.Math;
    var assignProjects = function(projects) {
        $scope.projects = projects;
    };

    var ErrorLoadingProjects = function(data,error) {
        msg.hideLoadingWithErr('Failed to load projects');
    };

    var loadProjects  = function(pageNumber) {
        $scope.pageNumber = pageNumber;
        msg.showLoadingWithInfo(resourceBundle.loading_projects);
        projectDao.getProjects(pageNumber * $scope.pageSize, $scope.pageSize)
        .then(assignProjects, ErrorLoadingProjects);
        msg.hideAll();
    };

    var onLoad = function() {
        projectDao.getCountOfProjects().then(function(result){
            if(result.total == 0) return;
            $scope.total = result.total;
            loadProjects(0);
        });
    };

    $scope.onNext = function(pageNumber) {
        loadProjects(pageNumber);
    };

    $scope.onPrevious = function(pageNumber) {
        loadProjects(pageNumber);
    };

    $scope.isLastPage = function() {
        return Math.ceil($scope.total/$scope.pageSize) == $scope.pageNumber + 1;
    };

    $scope.isFirstPage = function() {
        return $scope.pageNumber == 0;
    };

    $scope.isAtLast = function(index) {
        if($scope.isLastPage())
            return index ==  $scope.total % $scope.pageSize - 1 ;
        return index == $scope.pageSize-1;
    }

    onLoad();

    $scope.onDelete = function(project){
        function onConfirm(buttonIndex) {
            if(buttonIndex!=BUTTON_NO){
                console.log("Clicked Yes and deleting project: " +  project.name);
                projectDao.deleteProject(project.project_uuid).then(function(response) {
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
             // $scope.pageSize = {'value':$scope.total};
             loadProjects(0);
            },function() {
                msg.hideLoadingWithErr('projects not updated properly');
            });
        });
    };
};

dcsApp.controller('localProjectListController', ['$rootScope', '$scope', '$q', 'dcsService', 'projectDao', 'messageService', localProjectListController]);
