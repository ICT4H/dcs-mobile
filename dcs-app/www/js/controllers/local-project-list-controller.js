dcsApp.controller('projectListController', ['$rootScope', '$scope', '$q', 'dcsService', 'localStore', 'messageService', function($rootScope, $scope, $q, dcsService, localStore, msg) {

    resourceBundle = $rootScope.resourceBundle;
    $scope.pageTitle = $rootScope.title + ' - Projects';
    $scope.pageSizes = [5, 10, 15, 20];

    var assignProjects = function(projects) {
        $scope.projects = projects;
    };

    var ErrorLoadingProjects = function(data,error) {
        msg.hideLoadingWithErr(error+' Failed to load projects');
    };

    var loadProjects  = function(pageNumber) {
        $scope.pageNumber = pageNumber;
        localStore.getCountOfProjects().then(function(total){
            $scope.total = total;
        });
        msg.showLoadingWithInfo(resourceBundle.loading_projects);
        localStore.getProjects(pageNumber * $scope.pageSize.value, $scope.pageSize.value)
        .then(assignProjects, ErrorLoadingProjects);
        msg.hideAll();
    };

    $scope.onLoad = function() {
        $scope.pageSize = {'value':$scope.pageSizes[0]};
        loadProjects(0);
    };

    $scope.onNext = function(pageNumber) {
        if(pageNumber * $scope.pageSize.value < $scope.total)
            loadProjects(pageNumber);
    };

   $scope.onPrevious = function(pageNumber) {
        if (pageNumber >= 0) 
            loadProjects(pageNumber);
    };

    $scope.onPageSizeChange = function() {
        loadProjects(0);
    };

    $scope.onDelete = function(project){
        function onConfirm(buttonIndex) {
            if(buttonIndex!=BUTTON_NO){
                console.log("Clicked Yes and deleting project: " +  project.name);
                localStore.deleteProject(project.project_uuid).then(function() {
                    loadProjects($scope.pageNumber);
                    msg.hideLoadingWithInfo(resourceBundle.project_deleted);
                }, function(error) {
                    msg.handleError(error, resourceBundle.project_delete_error);
                });
            }
        };
        navigator.notification.confirm(
            'Do you want to delete ' + project.name + ' ?',
            onConfirm,
            'Delete project',
            ['Yes','No']
        );
    };

    $scope.onLoad();
    
    $scope.$sync = function() {
        msg.showLoading();
        var promises = [];
        $scope.projects.forEach(function(project) {
            promises.push(dcsService.getQuestion(project.project_uuid)
            .then(function(projectAtServer){
                if(project.version != projectAtServer.version){
                    project.status = OUTDATED;
                    localStore.updateProjectStatus(project.project_uuid,project.status);
                }
            },function(error){
                console.log('unable to get project details');
                if (404 == error) {
                    project.status = SERVER_DELETED;
                    localStore.updateProjectStatus(project.project_uuid,project.status);
                }
            }));
        });

        $q.all(promises).then(function() {
            msg.hideLoadingWithInfo('updated project list');
        },function() {
            msg.hideLoadingWithErr('projects not updated properly');
        });
    };


}]);
