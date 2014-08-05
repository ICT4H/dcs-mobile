dcsApp.controller('projectListController', ['$rootScope', '$scope', '$q', 'dcsService', 'localStore', 'messageService', function($rootScope, $scope, $q, dcsService, localStore, msg) {

    $scope.pageTitle = $rootScope.title + ' - Projects';

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
            $scope.getProjects($scope.next);
    }

    $scope.do_prev = function() {
        console.log('prev clicked');
        var allow = $scope.prev >= 0;
        if (allow)
            $scope.getProjects($scope.prev);
    }

    $scope.onPageSizeChange = function() {
        msg.showLoadingWithInfo('Loading submissions');
        $scope.pageSize = parseInt($scope.pageSize);
        $scope.getProjects(0);
    }
    
    $scope.$sync = function() {
        msg.showLoading();
        var promises = [];
        $scope.projects.forEach(function(project) {
            promises.push(dcsService.getQuestion(project.project_uuid)
            .then(function(projectAtServer){
                if(project.version != projectAtServer.version){
                    project.status = OUTDATED;
                    localStore.updateProjectStatus(project.project_id,project.status);
                }
            },function(error){
                console.log('unable to get project details');
                if (404 == error) {
                    project.status = SERVER_DELETED;
                    localStore.updateProjectStatus(project.project_id,project.status);
                }
            }));
        });

        $q.all(promises).then(function() {
            msg.hideLoadingWithInfo('updated project list');
        },function() {
            msg.hideLoadingWithErr('projects not updated properly');
        });
        console.log('projectListController refresh called');
    };

    $scope.deleteProject = function(project){
        function onConfirm(buttonIndex) {
            if(buttonIndex==BUTTON_NO) return;
            
            msg.showLoading();
            localStore.deleteProject(project.project_id).then(function() {
                project.status = SERVER;
                $scope.getProjects($scope.from);
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
