
requirejs.config({
	baseUrl: '/lib',
	paths: {
	    'angular': 'angular',
	    'angular-route': 'angular-route',
	    'promise': 'promise-4.0.0',
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

require(["index","angular","angular-route", "data_store", "promise"], function(index) {
    
	index.initialize();

});






