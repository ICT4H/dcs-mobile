var dcsApp = angular.module('dcsApp', ['ngRoute',
    "mobile-angular-ui",
    "ngSanitize",
    "ngI18n",
    "angucomplete-alt",
    "angularMoment",
    "angular-underscore"
]);

var isEmulator = false;
var BUTTON_NO = isEmulator ? 3 : 2;

var SERVER = 'server';
var LOCAL = 'local';
var BOTH = 'both';
var SERVER_DELETED = 'server-deleted';
var OUTDATED = 'outdated';

dcsApp.value('ngI18nConfig', {
    defaultLocale:'en',
    supportedLocales:['en'],
    basePath:'i18n',
    cache:true
});

dcsApp.run(['$route', '$rootScope', '$location', '$interval', '$timeout', 'messageService', 'ngI18nResourceBundle', 'ngI18nConfig', 'app', function($route, $rootScope, $location, $interval, $timeout, msg, ngI18nResourceBundle, ngI18nConfig, app) {
    ngI18nResourceBundle.get({locale: "en"}).success(function (resourceBundle) {
        $rootScope.resourceBundle = resourceBundle;
    });

    $rootScope.$on('$locationChangeSuccess', function(event, currentUrl, previousUrl) {
        //locationService.setUrl(previousUrl, currentUrl);
    });
    
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        backHandler.onRouteChange($location.path());
        console.log('going to ' + $location.path());
        if ($location.path() != '/' && !app.isAuthenticated && $location.path() != '/change-password') {
            $location.path('/');
        }
    }); 
        
    var timer;
    
    $rootScope.startMessageGC = function() {
        if ( angular.isDefined(timer) ) return;
        timer = $interval(function() {
            if($rootScope.showMessage == true)
                $timeout(function(){msg.hideMessage();}, 2000);
        }, 1000);
    };

    $rootScope.startMessageGC();
    $rootScope.pageSizes = [5, 10, 15, 20];
    $rootScope.pageSize = {'value':$rootScope.pageSizes[0]};
    $rootScope.logout = function() {
        console.log('logout');
        app.isAuthenticated = false;
        msg.showLoadingWithInfo('Logging out, please wait');
        setTimeout(function(){
            $location.path('/');
            msg.hideAll();
        },2000);
    };
    
    Number.prototype.showError = function() {
        msg.hideLoadingWithErr($rootScope.resourceBundle[this]);
    };

    Number.prototype.showInfo = function() {
        msg.showLoadingWithInfo($rootScope.resourceBundle[this]);
    };

    String.prototype.showError = function() {
        msg.hideLoadingWithErr($rootScope.resourceBundle[this]);
    };

    String.prototype.showInfoWithLoading = function() {
        msg.showLoadingWithInfo($rootScope.resourceBundle[this]);
    };

    String.prototype.showInfo = function() {
        msg.hideLoadingWithInfo($rootScope.resourceBundle[this]);  
    };

    $rootScope.removeMessage = function(index){
        msg.removeMessage(index);
    };

    $rootScope.createSurveyResponse = function(project_uuid) {
        $location.path('/projects/' + project_uuid + '/submissions/new');
    };

    $rootScope.showSearchicon = true;

    // back link in app page
    $rootScope.goBack = function() {
        var backLocation = backHandler.onBack();
        //TODO fix- since onBack on server project is asyn, else is executed & local projects are listed
        if (backLocation) {
            console.log('backbutton clicked: going to: ' + backLocation);
            $location.path(backLocation);
            $route.reload();
        } else {
            console.log('backbutton clicked: implicit navigation...');
            $location.path('/local-project-list');
            $route.reload();
            return false;
        }
    }

    // device back button
    document.addEventListener('backbutton', function() {
       return $rootScope.goBack();
    }, false);
}]);
