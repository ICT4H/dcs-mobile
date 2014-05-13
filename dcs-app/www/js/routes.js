define(['dcsApp','controllers/project-list-controller', 'controllers/submission-list-controller', 'dbService'], function(dcsApp, projectListController, submissionListController, dbService){
  'use strict';
  dcsApp.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
          $routeProvider
                        .when('/',{
                          templateUrl: "../partials/project-list.html",
                          controller: 'projectListController'
                         })
                        .when('/submission-list/:projectId',{
                          templateUrl: "partials/submission-list.html",
                          controller: 'submissionListController',
                        });  
          $httpProvider.defaults.headers.common['Authorization'] = 'Basic dGVzdGVyMTUwNDExQGdtYWlsLmNvbTp0ZXN0ZXIxNTA0MTE=';
        }]);
  dcsApp.factory('dbService', function(){
    return dbService;
  });
});