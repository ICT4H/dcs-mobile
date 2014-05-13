define(['dcsApp','controllers/project-list-controller', 'controllers/submission-list-controller', 'dbService'], function(dcsApp, projectListController, submissionListController, dbService){
  'use strict';
  dcsApp.config(['$routeProvider', function ($routeProvider) {
          $routeProvider
                        .when('/',{
                          templateUrl: "../partials/project-list.html",
                          controller: 'projectListController'
                         })
                        .when('/submission-list/:projectId',{
                          templateUrl: "partials/submission-list.html",
                          controller: 'submissionListController',
                        });  
        }]);
  dcsApp.factory('dbService', function(){
    return dbService;
  });
});