dcsApp.controller('localProjectListController', ['$rootScope', '$scope', '$q', 'dcsService', 'projectDao', 'messageService', function($rootScope, $scope, $q, dcsService, projectDao, msg) {

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
        projectDao.getCountOfProjects().then(function(result){
            $scope.total = result.total;
        });

        msg.showLoadingWithInfo(resourceBundle.loading_projects);
        projectDao.getProjects(pageNumber * $scope.pageSize.value, $scope.pageSize.value)
        .then(assignProjects, ErrorLoadingProjects);
        msg.hideAll();
    };

    var checkForProjectUpdates = function(){
        setInterval(function(){
            console.log("working");
            $scope.projects.forEach(function(project) {
                dcsService.getQuestion(project.project_uuid)
                .then(function(projectAtServer){
                    if(project.version != projectAtServer.version){
                        project.status = OUTDATED;
                        notification.addInfo(project.name + " is outdated.");
                    }
                }, function(error){
                    notification.addError(error);
                });
            });
        }, 10000);
    };

    $scope.onLoad = function() {
        msg.hideMessage();
        // checkForProjectUpdates();
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
                projectDao.deleteProject(project.project_uuid).then(function(response) {
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
                    projectDao.updateProject(project.project_uuid,project);
                }
            },function(error){
                console.log('unable to get project details');
                if (404 == error) {
                    project.status = SERVER_DELETED;
                    projectDao.updateProject(project.project_uuid,project);
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
