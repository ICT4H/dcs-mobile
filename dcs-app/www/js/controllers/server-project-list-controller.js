dcsApp.controller('serverProjectListController', ['$rootScope', '$scope', 'dcsService', 'localStore', 'messageService', function($rootScope, $scope, dcsService, localStore, msg) {

    $scope.pageTitle = $rootScope.title + ' - Projects';
    $scope.pageSize = 5;

    msg.showLoadingWithInfo('Loading projects');

    console.log('trying to get '+$scope.pageSize +' Projects');
      
    $scope.getProjects = function(start) {
        start = (typeof(start) == "number") ? start : 0;
        $scope.from = start + 1;
        
        dcsService.getProjects(start,$scope.pageSize)
            .then(function(projects) {
                $scope.total = projects.total;
                $scope.projects = projects.projects;
                if(projects.length <1) {
                    msg.hideLoadingWithInfo('No server projects !');
                    return;
                }
                $scope.to = start + $scope.projects.length;

                $scope.next = start + $scope.pageSize;
                $scope.prev = start - $scope.pageSize;

                msg.hideAll();
            },function(data,error) {
                msg.hideLoadingWithErr(error+' Failed to load projects');
                console.log('Error while loading server projects');
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
        msg.showLoadingWithInfo('Loading projects');
        $scope.pageSize = parseInt($scope.pageSize);
        $scope.getProjects(0);
    }
    
    $scope.$refreshContents = function() {
        console.log('projectListController refresh called');
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
