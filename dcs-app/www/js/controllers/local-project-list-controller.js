var localProjectListController = function($rootScope, $scope, $q, dcsService, contextService, projectDao, msg) {

    resourceBundle = $rootScope.resourceBundle;

    $scope.createSurveyResponse = contextService.createSurveyResponse;
    $scope.isProjectOutdated = contextService.isProjectOutdated;
    $scope.pagination = contextService.pagination;
    $scope.isDisplayable = [];
    $scope.selectedProjects = [];
    var assignProjects = function(projects) {
        $scope.projects = projects;
    };

    var ErrorLoadingProjects = function(data,error) {
        msg.hideLoadingWithErr('Failed to load projects');
    };

    var loadProjects  = function() {
        msg.showLoadingWithInfo(resourceBundle.loading_projects);
        projectDao.getProjects($scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
        .then(assignProjects, ErrorLoadingProjects);
        msg.hideAll();
    };

    var onLoad = function() {
        $scope.pagination.init($rootScope.pageSize.value, 0, loadProjects);
        projectDao.getCountOfProjects().then(function(result){
            if(result.total == 0) return;
            $scope.pagination.totalElement = result.total;
            loadProjects(0);
        });
    };

    onLoad();

    $scope.check = function(index, project_id) {
        $scope.isDisplayable[index] = false;
        $scope.selectedProjects.push(project_id);
    };

    $scope.unCheck = function(index, project_id) {
        $scope.isDisplayable[index] = true;
        delete $scope.selectedProjects[$scope.selectedProjects];
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

dcsApp.controller('localProjectListController', ['$rootScope', '$scope', '$q', 'dcsService', 'contextService', 'projectDao', 'messageService', localProjectListController]);
