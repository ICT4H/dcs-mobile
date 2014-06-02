
dcsApp.controller('projectListController', ['$rootScope', '$scope', 'dcsService', 'projectDao', function($rootScope, $scope, dcsService, projectDao) {

    $scope.pageTitle = $rootScope.title + ' - Projects';
    $rootScope.loading = true;
    var serverProjects = [];

    //TODO move the message related methods to a beeter place
    $rootScope.disableMessage = function(){
        $rootScope.showMessage = false;
    };

    var enableMessage = function(MessageType,message){
        $rootScope.css = MessageType;
        $rootScope.message_to_display = message;
        $rootScope.showMessage = true;
        if(!$scope.$$phase)
            $scope.$apply();
    };

    $rootScope.displaySuccess = function(message){
        enableMessage("alert-success", message);
    };
         
    $rootScope.displayInfo = function(message){
        enableMessage("alert-info",message);
    };

    $rootScope.displayError = function(message){
        enableMessage("alert-error",message);
    };

    var fetchMsg = 'Fetching project list...';
    $rootScope.displayInfo(fetchMsg);

    projectDao.getAllProject(function(localProjects){
        $rootScope.loading = false;
        $scope.$apply(function(){
            $rootScope.disableMessage();
            $scope.project = manageProjects(localProjects, []);
        },function(error){$rootScope.displayError(error);});
    });

    $scope.$refreshContents = function() {
        console.log('projectListController refresh called');
        $rootScope.displayInfo(fetchMsg);
        $rootScope.loading = true;
        dcsService.getQuestionnaires().then(function(serverProjects){
            $scope.$apply(function(){
                $scope.project = manageProjects($scope.project, serverProjects);
                $rootScope.disableMessage();
                $rootScope.loading = false;
            });
        },function(error){$rootScope.displayError(error);});
    }

    var manageProjects = function(localProjects, serverProjects){
        if(serverProjects.length == 0){
            localProjects.forEach(function(localProject){
                localProject.isStored = true;
            }); 
            return localProjects;
        }
        serverProjects.forEach(function(serverProject){
            serverProject.isStored = false;
            localProjects.forEach(function(localProject){
                if(serverProject.id == localProject.id){
                    serverProject.isStored = true; 
                }
            });
        });
        return serverProjects; 
    };

    $scope.deleteProject = function(project){
        projectDao.deleteProject(project.id, function(id){
            projectDao.deleteRelatedSubmission(id, function(deletedId){
                $rootScope.displaySuccess('Project deleted!')
                $scope.$refreshContents();
            });
        });
    };

    $scope.downloadProject = function(project){
        project.document_type = 'survey';
        delete project["isStored"];
        projectDao.createProject(project, function(downloadedId){
            $scope.$refreshContents();
            $rootScope.displaySuccess('Project downloaded!')
        });
    };



}]);
