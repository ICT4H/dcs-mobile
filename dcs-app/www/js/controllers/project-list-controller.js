dcsApp.controller('projectListController', ['$rootScope', '$scope', 'dcsService', 'localStore', 'messageService', function($rootScope, $scope, dcsService, localStore, msg) {

    $scope.pageTitle = $rootScope.title + ' - Projects';
    msg.showLoadingWithInfo('Loading projects');
    var serverProjects = [];

    console.log('trying to get allProjects');
    localStore.getAllLocalProjects()
        .then(function(localProjects){
            if(!$rootScope.projects)
                $rootScope.projects = localProjects || [];
            msg.hideAll();
        }, function(error) {
            msg.handleError(error,'Unable to show local projects');
        }
    );

    $scope.$refreshContents = function() {
        console.log('projectListController refresh called');
        msg.showLoadingWithInfo('Fetching server projects');
        
        dcsService.getQuestionnaires()
            .then(function(serverProjects) {
                updateProjectsToDisplay($rootScope.projects, serverProjects);
                msg.hideAll();
            }, function(error) {
                msg.handleError(error,' Unable fetch server projects')
            });
    };

    var updateProjectsToDisplay = function(projectsInScope, serverProjects){
        serverProjects.forEach(function(serverProject){
            addServerOnlyProject(projectsInScope,serverProject);
        });
        projectsInScope.forEach(function(localProject){
            updateLocalProjectStatus(serverProjects, localProject);
        });

    };
    var updateLocalProjectStatus = function(projects,localProject) {
        for (var i = 0; i < projects.length; i++) {
            if(localProject.project_uuid == projects[i].project_uuid) {
                if(projects[i].version != localProject.version) {
                    localProject.status = OUTDATED;
                    localStore.updateProjectStatus(localProject.project_id, OUTDATED);
                }
                return;
            }
        }
        localProject.status = SERVER_DELETED;
        localStore.updateProjectStatus(localProject.project_id, SERVER_DELETED);
    };

    var addServerOnlyProject = function(projects,serverProject) {
        for (var i = 0; i < projects.length; i++) {
            if(serverProject.project_uuid == projects[i].project_uuid) return;
        }
        serverProject.status = SERVER;
        projects.push(serverProject);
    };


    $scope.deleteProject = function(project){
        function onConfirm(buttonIndex) {
            if(buttonIndex==BUTTON_NO) return;
            
            msg.showLoading();
            localStore.deleteProject(project.project_id).then(function() {
                project.status = SERVER;
                msg.hideLoadingWithInfo('Project deleted!');
            }, function(error) {
                msg.handleError(error,'Project cannot be deleted');
            });

        };
        navigator.notification.confirm(
            'Do you want to delete '+project.name+' ?',
            onConfirm,
            'Delete project',
            ['Yes','No']
        );
    };

    $scope.downloadProject = function(project) {
        var project_uuid = project.project_uuid;
        msg.showLoadingWithInfo('Downloading project');

        dcsService.getQuestion(project_uuid)
            .then(localStore.createProject)
            .then(function(project_id) {
                project.project_id = project_id;
                if (project.status == OUTDATED) {
                    var tmpPrj = angular.copy(project);
                    tmpPrj.status = BOTH;
                    $rootScope.projects.unshift(tmpPrj);
                } else {
                    project.status = BOTH;
                }         
                msg.hideLoadingWithInfo('Project downloaded.');
            }, function(error) {
                project.status = SERVER;
                msg.handleError(error,'Unable to download project');
            });
    };

}]);
