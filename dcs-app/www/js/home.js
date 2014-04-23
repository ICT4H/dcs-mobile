
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

		'data_store': '../js/data_store',
		'index': '../js/index'
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
		"index": ['angular', 'data_store'],
		'data_store':['promise']
	}
	// ,deps['app']
});

require(["index","angular","angular-route", 'mobile-angular-ui', 'mobile-angular-ui-touch-fastclick', 'mobile-angular-ui-scrollable-overthrow',
	"data_store", "promise"], function(index) {
    
	index.initialize();

});






