dcsApp.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
    $routeProvider
        .when('/',{
          templateUrl: "partials/login.html",
          controller: 'loginController'
         })
        .when('/server-submissions/:project_uuid',{
          templateUrl: "partials/server-submission-list.html",
          controller: 'serverSubmissionController'
         })
        .when('/manage-columns/:project_uuid',{
          templateUrl: "partials/manage-columns.html",
          controller: 'manageColumnsController'
         })
        .when('/local-project-list',{
          templateUrl: "partials/local-project-list.html",
          controller: 'localProjectListController'
         })
        .when('/server-project-list',{
          templateUrl: "partials/server-project-list.html",
          controller: 'serverProjectListController'
         })
        .when('/submission-list/:project_uuid',{
          templateUrl: "partials/submission-list.html",
          controller: 'submissionListController',
        })
        .when('/submission/conflict/id/:submission_id/project_uuid/:project_uuid',{
          templateUrl: "partials/submission-conflict.html",
          controller: 'submissionConflictController',
        })
        .when('/about',{
          templateUrl: "partials/about.html",
          controller: 'localProjectListController',
        })
        .when('/project/:project_uuid/submission/:submission_id', {
          templateUrl: "partials/submission.html",
          controller: 'submissionController'
        })
        .when('/settings', {
          templateUrl: "partials/settings.html",
          controller: 'settingsController'
        })
        .when('/change-password', {
          templateUrl: "partials/change-password.html",
          controller:'changePasswordController'
        }); 
    $httpProvider.defaults.timeout = 1000;
}]);
