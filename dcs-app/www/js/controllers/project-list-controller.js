
dcsApp.controller('projectListController', ['$rootScope', '$scope', 'dcsService', 'localStore', 'messageService', function($rootScope, $scope, dcsService, localStore, msg) {

    $scope.pageTitle = $rootScope.title + ' - Projects';
    msg.showLoadingWithInfo('Loading projects');
    var serverProjects = [];

    localStore.getAllLocalProjects()
        .then(function(localProjects){
            $scope.projects = localProjects || [];
            msg.hideAll();
        }, function(e) {
            msg.hideLoadingWithErr('Unable to show local projects');
        }
    );

    $scope.$refreshContents = function() {
        console.log('projectListController refresh called');
        msg.showLoadingWithInfo('Fetching server projects');
        
        dcsService.getQuestionnaires()
            .then(function(serverProjects) {
                updateProjectsToDisplay($scope.projects, serverProjects);
                msg.hideAll();
            }, function(error) {
                msg.hideLoadingWithErr('Unable fetch server projects');
            });
    }

    var updateProjectsToDisplay = function(projectsInScope, serverProjects){
        serverProjects.forEach(function(serverProject){
            serverProject.status = SERVER;

            projectsInScope.forEach(function(localProject){
                if(serverProject.project_uuid == localProject.project_uuid){
                    serverProject.status = BOTH;
                }
            });
            if(serverProject.status == SERVER)
                projectsInScope.push(serverProject);
        });
        var onServer, outdated;
        projectsInScope.forEach(function(localProject){
            onServer = outdated = false;
            serverProjects.forEach(function(serverProject){
                if(localProject.project_uuid == serverProject.project_uuid){
                    onServer = true;
                    if(localProject.version != serverProject.version) {
                        outdated = true;
                    }
                }
            });
            if(!onServer){
                localProject.status = SERVER_DELETED;
            } else if(outdated) {
                localProject.status = OUTDATED;
            }
        });

    };

    $scope.deleteProject = function(project){
        var BUTTON_NO = 3;
        function onConfirm(buttonIndex) {
            if(buttonIndex==BUTTON_NO) return;
            
            msg.showLoading();
            localStore.deleteProject(project.project_id).then(function() {
                project.status = SERVER;
                msg.hideLoadingWithInfo('Project deleted!');
            }, function(e) {
                msg.hideLoadingWithErr('Project cannot be deleted');
            });

        };
        navigator.notification.confirm(
            'Do you want to delete '+project.name+' ?',
            onConfirm,
            'Delete project',
            ['Yes','No']
        );
    };

    $scope.downloadProject = function(project){
        var project_uuid = project.project_uuid;
        msg.showLoadingWithInfo('Downloading project');
        project.status = BOTH;
        dcsService.getQuestion(project_uuid)
            .then(localStore.createProject)
            .then(function(project_id) {
                project.project_id = project_id;
                msg.hideLoadingWithInfo('Project downloaded.');
            }, function(e) {
                project.status = SERVER;
                msg.hideLoadingWithErr('Unable to download project');
            });
    };



}]);
