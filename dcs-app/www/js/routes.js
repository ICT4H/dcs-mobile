dcsApp.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
    $routeProvider
        .when('/',{
          templateUrl: "partials/project-list.html",
          controller: 'projectListController'
         })
        .when('/submission-list/:projectId',{
          templateUrl: "partials/submission-list.html",
          controller: 'submissionListController',
        })
        .when('/about',{
          templateUrl: "partials/about.html",
          controller: 'projectListController',
        })
        .when('/settings-list',{
          templateUrl: "partials/settings.html",
          controller: 'settingsController'
        })
        .when('/submission/:surveyId/surveyResponse/:surveyResponseId', {
          templateUrl: "partials/submission.html",
          controller: 'submissionController'
        }); 

    $httpProvider.defaults.timeout = 1000;
}]);

dcsApp.factory('dbService', function(){
    return dbService;
});
