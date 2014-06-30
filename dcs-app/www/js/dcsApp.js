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

function convertToSlug(Text) {
    return Text
        .toLowerCase()
        .replace(/[^\w-]+/g,'')
        ;
}

dcsApp.run(['$http', '$rootScope', 'auth', function($http, $rootScope, auth) {

    $rootScope.title = 'D Collector';

    $rootScope.$back = function() {
        console.log('back clicked');
        window.history.back();
    };

    var credentials = {};
    credentials.username = auth.getCurrentUser().name;
    credentials.password = auth.getCurrentUser().password;
    credentials.serverUrl= credentials.serverUrl;

    // TODO remove this hardcoding with auth.getCurrentUser().name
    credentials.username = 'tester150411@gmail.com';
    credentials.password = 'tester150411';
    credentials.serverUrl= 'http://10.4.31.52:8001';
    //credentials.serverUrl= 'https://dcsweb.twhosted.com';
    //credentials.serverUrl= 'http://localhost:3000';

    $rootScope.httpRequest = function(uri) {
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
        return $http.get(credentials.serverUrl + uri);
    };
    $rootScope.httpPostRequest = function(uri, data) {
        $http.defaults.headers.post["Content-Type"] = "text/plain";
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
        return $http.post(credentials.serverUrl + uri, data);
    };


}]);