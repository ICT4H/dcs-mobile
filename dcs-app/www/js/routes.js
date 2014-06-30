dcsApp.config(['$routeProvider', '$httpProvider', '$provide', function ($routeProvider, $httpProvider, $provide) {
    $routeProvider
        .when('/',{
          templateUrl: "partials/login.html",
          controller: 'loginController'
         })
        .when('/project-list',{
          templateUrl: "partials/project-list.html",
          controller: 'projectListController'
         })
        .when('/submission-list/:project_id/project_uuid/:project_uuid/project_name/:project_name',{
          templateUrl: "partials/submission-list.html",
          controller: 'submissionListController',
        })
        .when('/about',{
          templateUrl: "partials/about.html",
          controller: 'projectListController',
        })
        .when('/settings',{
          templateUrl: "partials/settings.html",
          controller: 'settingsController'
        })
        .when('/project/:project_id/submission/:submission_id', {
          templateUrl: "partials/submission.html",
          controller: 'submissionController'
        })
        .when('/import', {
          templateUrl: "partials/import.html",
          controller: 'importController'
        }); 

    $httpProvider.defaults.timeout = 1000;
    
}]);
