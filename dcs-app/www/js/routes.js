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

dcsApp.run(['$http', '$rootScope', function($http, $rootScope) {

    $rootScope.title = 'D Collector';
    
    $rootScope.$back = function() {
        console.log('back clicked');
        window.history.back();
    };

    // TODO the password should be entered by the user every time app starts.
    var credentials = {};
    credentials.username = 'tester150411@gmail.com';
    credentials.password = 'tester150411';
    credentials.serverUrl= 'http://localhost:8001';
    //credentials.serverUrl= 'https://dcsweb.twhosted.com';
    //credentials.serverUrl= 'http://localhost:3000';

    $rootScope.httpRequest = function(url) {
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
        return $http.get(credentials.serverUrl + url);
    };
    $rootScope.httpPostRequest = function(url, data) {
        $http.defaults.headers.post["Content-Type"] = "text/plain";
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
        return $http.post(credentials.serverUrl + url, data);
    };


}]);
