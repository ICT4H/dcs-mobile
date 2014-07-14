var dcsApp = angular.module('dcsApp', ['ngRoute',
    "mobile-angular-ui",
    "mobile-angular-ui.touch",
    "mobile-angular-ui.scrollable",
    "ngSanitize"
]);

var isEmulator = false;
var BUTTON_NO = isEmulator ? 3 : 2;

var SERVER = 'server';
var LOCAL = 'local';
var BOTH = 'both';
var SERVER_DELETED = 'server-deleted';
var OUTDATED = 'outdated';

function convertToSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\w-]+/g,'');
}

dcsApp.run(['$http', '$rootScope', '$location', '$q', 'auth', 'messageService', function($http, $rootScope, $location, $q, auth, msg) {

    $rootScope.title = 'D Collector';


    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        //$rootScope.isAuthenticated = true;

        console.log('going to ' + $location.path());
        if ($location.path() != '/' && !auth.isLoggedIn()) {
            $location.path('/');
        }
        // else {

        // }

        // if ($rootScope.isAuthenticated  next.path == '/')) {
        //     if(Auth.isLoggedIn()) $location.path('/');
        //     else                  $location.path('/login');
        // }
    });
    $rootScope.logout = function() {
        console.log('logout');
        auth.logout();
        msg.showLoadingWithInfo('Logging out, please wait');
        setTimeout(function(){
            $location.path('/');
            msg.hideAll();
        },2000);
    };
    $rootScope.$back = function() {
        console.log('back clicked');
        window.history.back();
    };

    var getUser = function() {
        var user = auth.getCurrentUser();
        // user.name = 'tester150411@gmail.com';
        // user.password = 'tester150411';
        //user.serverUrl= 'http://10.37.129.2:8001';
        return user;
    }


    $rootScope.httpRequest = function(uri) {
        var deferred = $q.defer();
        var user = getUser();
        console.log('calls user name: ' + user.name);
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(user.name + ':' + user.password);
        $http.get(user.serverUrl + uri).success(deferred.resolve).error(function(data, status, headers, config) {
            deferred.reject(status);
        });

        return deferred.promise;
    };

    $rootScope.httpPostRequest = function(uri, data) {
        var deferred = $q.defer();

        var user = getUser();
        console.log('calls user name: ' + user.name);
        $http.defaults.headers.post["Content-Type"] = "text/plain";
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(user.name + ':' + user.password);
        
        $http.post(user.serverUrl + uri, data).success(deferred.resolve).error(function(data, status, headers, config) {
            deferred.reject(status);
        });
        return deferred.promise;
    };

}]);