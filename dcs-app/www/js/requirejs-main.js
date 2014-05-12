
requirejs.config({
	baseUrl: 'js',
	waitSeconds: 400,
	paths: {
	    'angular': 'lib/angular',
	    'angular-route': 'lib/angular-route',
	    'promise': 'lib/promise-4.0.0',
	    'mobile-angular-ui': 'lib/mobile-angular-ui',
	    'mobile-angular-ui-touch-fastclick': 'lib/mobile-angular-ui-touch-fastclick',
		'mobile-angular-ui-scrollable-overthrow': 'lib/mobile-angular-ui-scrollable-overthrow',
		'cordova-index': '/js/cordova-index',
		'idbstore': 'lib/idbstore.min',
		'dbService': 'services/dbService'
	},
	shim: {
		'angular': {
			exports: 'angular'
		},
		'angular-route': {
			deps:['angular'],
		},
		'mobile-angular-ui': ['angular'],
		'mobile-angular-ui-touch-fastclick': ['angular'],
		'mobile-angular-ui-scrollable-overthrow': ['angular'],
	}
});

require(['angular','angular-route', 'dcsApp', 'routes', 'mobile-angular-ui', 
	'mobile-angular-ui-touch-fastclick', 'mobile-angular-ui-scrollable-overthrow'], function(angular){
	 angular.bootstrap( document.getElementsByTagName("body")[0], [ 'dcsApp' ]);
});





