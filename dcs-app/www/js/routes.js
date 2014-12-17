dcsApp.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
    $routeProvider
        .when('/',{
          templateUrl: "partials/login.html",
          controller: 'loginController',
          reloadOnSearch: false
         })
        .when('/server-submissions/:project_uuid',{
          templateUrl: "partials/server-submission-list.html",
          controller: 'serverSubmissionController',
          reloadOnSearch: false
         })
        .when('/manage-columns/:project_uuid',{
          templateUrl: "partials/manage-columns.html",
          controller: 'manageColumnsController',
          reloadOnSearch: false
         })
        .when('/local-project-list',{
          templateUrl: "partials/local-project-list.html",
          controller: 'localProjectListController',
          reloadOnSearch: false
         })
        .when('/server-project-list',{
          templateUrl: "partials/server-project-list.html",
          controller: 'serverProjectListController',
          reloadOnSearch: false
         })
        .when('/submission-list/:project_uuid',{
          templateUrl: "partials/submission-list.html",
          controller: 'submissionListController',
          reloadOnSearch: false
        })
        .when('/about',{
          templateUrl: "partials/about.html",
          controller: 'localProjectListController',
          reloadOnSearch: false
        })
        .when('/project/:project_uuid/submission/:submission_id', {
          templateUrl: "partials/submission.html",
          controller: 'submissionController',
          reloadOnSearch: false
        })
        .when('/settings', {
          templateUrl: "partials/settings.html",
          controller: 'settingsController',
          reloadOnSearch: false
        })
        .when('/change-password', {
          templateUrl: "partials/change-password.html",
          controller:'changePasswordController',
          reloadOnSearch: false
        })
        .when('/conflict-submission-list/:project_uuid', {
          templateUrl: "partials/conflict-submission-list.html",
          controller: 'submissionConflictController',
          reloadOnSearch: false
        })
        .when('/conflict-resolver/:project_uuid/:submission_uuid', {
          templateUrl: "partials/submission-conflict-resolver.html", 
          controller: 'submissionConflictResolverController',
          reloadOnSearch: false
        }); 
    $httpProvider.defaults.timeout = 1000;
}]);
