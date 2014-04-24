
requirejs.config({
	baseUrl: 'lib',
	waitSeconds: 400,
	paths: {
	    'angular': 'angular',
	    'angular-route': 'angular-route',
	    'promise': 'promise-4.0.0',
	    'mobile-angular-ui': 'mobile-angular-ui',
	    'mobile-angular-ui-touch-fastclick': 'mobile-angular-ui-touch-fastclick',
		'mobile-angular-ui-scrollable-overthrow': 'mobile-angular-ui-scrollable-overthrow',

		'angular-app': '../js/angular-app',
		'data_store': '../js/data_store',
		'cordova-index': '../js/cordova-index'
	},
	shim: {
		'angular': {
			'exports': 'angular'
		},
		'angular-route': {
			deps:['angular'],
			export:'ngRoute'
		},
		'mobile-angular-ui': ['angular'],
		'mobile-angular-ui-touch-fastclick': ['angular'],
		'mobile-angular-ui-scrollable-overthrow': ['angular'],
		
		'angular-app': ['angular', 'data_store', 'mobile-angular-ui-touch-fastclick', 'mobile-angular-ui-scrollable-overthrow'],
		'cordova-index': ['angular-app'],
		'data_store':['promise']
	}
	// ,deps['app']
});

require(['cordova-index', 'angular-app', 'angular','angular-route', 'mobile-angular-ui', 'mobile-angular-ui-touch-fastclick', 'mobile-angular-ui-scrollable-overthrow',
	'data_store', 'promise'], function(cordovaIndex) {
    
	cordovaIndex.initialize();

});






