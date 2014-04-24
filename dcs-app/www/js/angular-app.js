var DCS = {};

DCS.intAngularApp = function() {
  
  var projectsApp = angular.module('projectsApp', [
    "ngRoute",
    "mobile-angular-ui",
    "mobile-angular-ui.touch",
    "mobile-angular-ui.scrollable"
  ]);


  projectsApp.controller("SubmissionListCtrl", function($scope, ProjectService) {
      console.log('in controller');
      ProjectService.list().then(function(responce){
          $scope.$apply(function () {
              $scope.submissions = responce;
          });
      }, function(err){
          console.log('error');
      });
  });

  projectsApp.service('ProjectService', function() {
      return ProjectStore;
  });

  projectsApp.config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/',{
      templateUrl: "partials/project-list.html",
      controller: 'MainController',
      resolve: {
         'ProjectService': function(ProjectService) {
           return ProjectService.init();
         }
     }
    });
    $routeProvider.when('/submission-list',{
      templateUrl: "partials/submission-list.html",
      controller: 'SubmissionListCtrl',
      resolve: {
         'ProjectService': function(ProjectService) {
           return ProjectService.init();
         }
     }
    }); 
  });

  projectsApp.controller('MainController', function($rootScope, $scope){

    $rootScope.$on("$routeChangeStart", function(){
      $rootScope.loading = true;
    });

    $rootScope.$on("$routeChangeSuccess", function(){
      $rootScope.loading = false;
    });

    //$scope.userAgent =  navigator.userAgent;

    var scrollItems = [];
    for (var i=1; i<=20; i++) {
      scrollItems.push("Project " + i);
    }
    $scope.scrollItems = scrollItems;
  });

  angular.bootstrap( document.getElementsByTagName("body")[0], [ 'projectsApp' ]);
}