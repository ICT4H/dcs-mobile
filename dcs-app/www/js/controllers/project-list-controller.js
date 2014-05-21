'use strict';

define(['dcsApp', 'dcsService', '../dao/project-dao'], function(dcsApp, dcsService, projectDao){
    var projectListController = function($rootScope, $scope, dcsService, projectDao){
       
        $rootScope.loading = true;
        $scope.init = function(){
            var serverProjects = [];
             dcsService.getQuestionnaires().then(function(serverProjects){
                projectDao.getAllProject(function(localProjects){
                    $rootScope.loading = false;
                    $scope.$apply(function(){
                        $scope.project = manageProjects(localProjects, serverProjects);
                    });
                },function(error){console.log(error);});
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
                    console.log(deletedId + ' deleted.')
                });
            });
        };

        $scope.downloadProject = function(project){
            project.document_type = 'survey';
            delete project["isStored"];
            projectDao.createProject(project, function(downloadedId){
                console.log(downloadedId + ' downloaded.')
            });
        };
            
        $rootScope.displaySuccess = function(message){
            $rootScope.showMessage = true;
            $rootScope.message_to_display = message;
            $rootScope.css = "alert-success";
            $scope.$apply();
        };

        $rootScope.displayInfo = function(message){
            $rootScope.showMessage = true;
            $rootScope.message_to_display = message;
            $rootScope.css = "alert-info";
            $scope.$apply();
        };

        $rootScope.displayError = function(message){
            $rootScope.showMessage = true;
            $rootScope.message_to_display = message;
            $rootScope.css = "alert-error";
            $scope.$apply();
        };

        $scope.init();
    };
    dcsApp.controller('projectListController', ['$rootScope', '$scope', 'dcsService', 'projectDao', projectListController]);
}); 