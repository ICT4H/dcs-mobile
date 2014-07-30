dcsApp.controller('projectListController', ['$rootScope', '$scope', 'dcsService', 'localStore', 'messageService', function($rootScope, $scope, dcsService, localStore, msg) {

    $scope.pageTitle = $rootScope.title + ' - Projects';
    $scope.context = 'local Project list';

    $scope.pageSize = 5;

    msg.showLoadingWithInfo('Loading projects');

    console.log('trying to get '+$scope.pageSize +' Projects');
      
    $scope.getProjects = function(start) {
        start = (typeof(start) == "number") ? start : 0;
        $scope.from = start + 1;

        localStore.getCountOfProjects()
            .then(function(total) {
                $scope.total = total;
                localStore.getProjects(start,$scope.pageSize)
                    .then(function(projects) {
                        $scope.projects = projects;
                        if(projects.length <1) {
                            msg.hideLoadingWithInfo('No local projects !');
                            return;
                        }
                        $scope.to = start + projects.length;

                        $scope.next = start + $scope.pageSize;
                        $scope.prev = start - $scope.pageSize;

                        msg.hideAll();
                    },function(data,error) {
                        msg.hideLoadingWithErr(error+' Failed to load projects');
                        console.log('Error while loading local projects');
                    });
            },function() {
                console.log('Error while counting local projects');
            });
    };
    $scope.getProjects(0);
    $scope.do_next = function() {
        console.log('next clicked');
        var allow = $scope.total > $scope.next;
        if (allow)
            $scope.getSubmissions($scope.next);
    }

    $scope.do_prev = function() {
        console.log('prev clicked');
        var allow = $scope.prev >= 0;
        if (allow)
            $scope.getSubmissions($scope.prev);
    }

    $scope.onPageSizeChange = function() {
        msg.showLoadingWithInfo('Loading submissions');
        $scope.pageSize = parseInt($scope.pageSize);
        $scope.getSubmissions(0);
    }
    
    $scope.$refreshContents = function() {
        console.log('projectListController refresh called');
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
}]);
