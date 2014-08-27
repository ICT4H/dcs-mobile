var dcsApp = angular.module('dcsApp', ['ngRoute',
    "mobile-angular-ui",
    "mobile-angular-ui.touch",
    "mobile-angular-ui.scrollable",
    "ngSanitize",
    "ngI18n"
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

dcsApp.run(['$rootScope', '$location', 'messageService', 'ngI18nResourceBundle', 'ngI18nConfig', 'settings', 'store', function($rootScope, $location, msg, ngI18nResourceBundle, ngI18nConfig, settings, store) {
    $rootScope.title = 'D Collector';
    ngI18nResourceBundle.get({locale: "en"}).success(function (resourceBundle) {
        $rootScope.resourceBundle = resourceBundle;
    });

    $rootScope.$on("$routeChangeStart", function (event, next, current) {

        console.log('going to ' + $location.path());
        if ($location.path() != '/' && !settings.isAuthenticated) {
            $location.path('/');
        }
    }); 

    $rootScope.logout = function() {
        console.log('logout');
        settings.isAuthenticated = false;
        msg.showLoadingWithInfo('Logging out, please wait');
        setTimeout(function(){
            $location.path('/');
            msg.hideAll();
        },2000);
    };

    $rootScope.removeMessage = function(index){
        msg.removeMessage(index);
    } 

    $rootScope.$back = function() {
        console.log('back clicked');
        window.history.back();
    };

}]);
