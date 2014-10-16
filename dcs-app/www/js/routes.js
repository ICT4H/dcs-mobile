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
        })
        .when('/conflict-submission-list/:project_uuid', {
          templateUrl: "partials/conflict-submission-list.html",
          controller: 'submissionConflictController'
        })
        .when('/conflict-resolver/:project_uuid/:submission_uuid', {
          templateUrl: "partials/submission-conflict-resolver.html", 
          controller: 'submissionConflictResolverController'
        }); 
    $httpProvider.defaults.timeout = 1000;
}]);
