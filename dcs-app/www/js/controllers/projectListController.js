'use strict';

define(['dcsApp', 'services/dcsService', '../dao/projectDao'], function(dcsApp, dcsService, projectDao){
    var projectListController = function($rootScope, $scope, dcsService, projectDao){

        $rootScope.loading = true;

        $scope.init = function(){
            var serverProjects = null;
             dcsService.getQuestionnaires().success(function(projects){
                serverProjects = projects;
            }).error(function(error){
                serverProjects =[];
            }).finally(function(){
                projectDao.getAllProject(function(localProjects){
                    $scope.$apply(function(){
                        $scope.project = manageProjects(localProjects, serverProjects);
                    });
                },function(error){console.log(error);});
            });
        };

        var manageProjects = function(localProjects, serverProjects){
            $rootScope.loading = false;
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
        
        $scope.init();
    };
    dcsApp.controller('projectListController', ['$rootScope', '$scope', 'dcsService', 'projectDao', projectListController]);
}); 