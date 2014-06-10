
dcsApp.controller('projectListController', ['$rootScope', '$scope', 'dcsService', 'localStore', function($rootScope, $scope, dcsService, localStore) {

    $scope.pageTitle = $rootScope.title + ' - Projects';
    $rootScope.loading = true;
    var serverProjects = [];

    //TODO move the message related methods to a better place
    $rootScope.disableMessage = function(){
        $rootScope.showMessage = false;
        $rootScope.apply();
    };

    var enableMessage = function(MessageType,message){
        $rootScope.css = MessageType;
        $rootScope.message_to_display = message;
        $rootScope.showMessage = true;
        $rootScope.apply();
    };

    $rootScope.hideLoading = function() {
        $rootScope.loading = false;
        $rootScope.apply();
    }

    $rootScope.apply = function() {
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }

    $rootScope.displaySuccess = function(message){
        enableMessage("alert-success", message);
    };
         
    $rootScope.displayInfo = function(message){
        enableMessage("alert-info",message);
    };

    $rootScope.displayError = function(message){
        enableMessage("alert-danger",message);
    };

    var fetchMsg = 'Fetching project list...';
    $rootScope.displayInfo(fetchMsg);

    localStore.getAllLocalProjects().then(function(localProjects){
        $rootScope.loading = false;
        $scope.$apply(function(){
            $rootScope.disableMessage();
            $scope.projects = localProjects || [];
        },function(error){$rootScope.displayError(error);});
    });

    $scope.$refreshContents = function() {
        console.log('projectListController refresh called');
        $rootScope.displayInfo(fetchMsg);
        $rootScope.loading = true;
        dcsService.getQuestionnaires().then(function(serverProjects){
            $scope.$apply(function(){
                updateProjectsToDisplay($scope.projects, serverProjects);
                $rootScope.disableMessage();
                $rootScope.loading = false;
            });
        }, function(error){$rootScope.displayError(error);});
    }

    var updateProjectsToDisplay = function(projectsInScope, serverProjects){
        serverProjects.forEach(function(serverProject){
            serverProject.isStored = false;
            projectsInScope.forEach(function(localProject){
                if(serverProject.project_uuid == localProject.project_uuid){
                    serverProject.isStored = true; 
                }
            });
            if(!serverProject.isStored)
                projectsInScope.push(serverProject);
        });
    };

    $scope.deleteProject = function(project){
        $rootScope.loading = true;
        localStore.deleteProject(project.project_id).then(function() {
            project.isStored = false;
            $rootScope.displaySuccess('Project deleted!');
        }, function(e) {
            project.isStored = true;
            $rootScope.displayError('Project cannot be deleted.');
        });
    };

    $scope.downloadProject = function(project){
        var project_uuid = project.project_uuid;
        $rootScope.loading = true;
        dcsService.getQuestion(project_uuid).then(function(serverProject){
            localStore.createProject(serverProject).then(function(project_id) {
                project.project_id = project_id;
                project.isStored = true;
                $rootScope.loading = false;
                $rootScope.displaySuccess('Project downloaded.');
            }, $rootScope.displayError);
        }, function(error){$rootScope.displayError(error);});
    };



}]);
