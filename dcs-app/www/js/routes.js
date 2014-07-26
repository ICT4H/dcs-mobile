dcsApp.config(['$routeProvider', '$httpProvider', '$provide', function ($routeProvider, $httpProvider, $provide) {
    $routeProvider
        .when('/',{
          templateUrl: "partials/login.html",
          controller: 'loginController'
         })
        .when('/server-submissions/:project_id',{
          templateUrl: "partials/server-submisssion-list.html",
          controller: 'serverSubmissionController'
         })
        .when('/manage-columns/:project_id',{
          templateUrl: "partials/manage-columns.html",
          controller: 'manageColumnsController'
         })
        .when('/project-list',{
          templateUrl: "partials/project-list.html",
          controller: 'projectListController'
         })
        .when('/submission-list/:project_id',{
          templateUrl: "partials/submission-list.html",
          controller: 'submissionListController',
        })
        .when('/submission/conflict/id/:submission_id/project_id/:project_id',{
          templateUrl: "partials/submission-conflict.html",
          controller: 'submissionConflictController',
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
