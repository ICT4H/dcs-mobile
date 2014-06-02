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
    credentials.serverUrl= 'http://localhost:8000';

    $rootScope.credentials = credentials;

    $rootScope.httpRequest = function(url) {
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
        return $http.get(credentials.serverUrl + url);
    };

}]);
