'use strict';

define(['dcsApp', 'dcsService', '../dao/project-dao'], function(dcsApp, dcsService, projectDao){
    var projectListController = function($rootScope, $scope, dcsService, projectDao){
       
        $rootScope.loading = true;
        $scope.init = function(){
            var serverProjects = [];
            $rootScope.displayInfo('Updating project list.......');
             dcsService.getQuestionnaires().then(function(serverProjects){
                projectDao.getAllProject(function(localProjects){
                    $rootScope.loading = false;
                    $scope.$apply(function(){
                        $rootScope.disableMessage();
                        $scope.project = manageProjects(localProjects, serverProjects);
                    });
                },function(error){$rootScope.displayError(error);});
            });
        };
        
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
                });
            });
        };

        $scope.downloadProject = function(project){
            project.document_type = 'survey';
            delete project["isStored"];
            projectDao.createProject(project, function(downloadedId){
               $rootScope.displaySuccess('Project downloaded!')
            });
        };

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

        $scope.init();
    };
    dcsApp.controller('projectListController', ['$rootScope', '$scope', 'dcsService', 'projectDao', projectListController]);
}); 