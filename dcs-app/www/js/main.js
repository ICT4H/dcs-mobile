
requirejs.config({
	baseUrl: '/lib',
	paths: {
	    'angular': 'angular',
	    'angular-route': 'angular-route',
	    'promise': 'promise-4.0.0',
	    'data_store': '../js/data_store'
	},
	shim: {
		'angular': {
			'exports': 'angular'
		},
		'angular-route': {
			deps:['angular'],
			export:'ngRoute'
		},
		'data_store':['promise']
	}
	// ,deps['app']
});

define("app", ["angular","angular-route", "data_store", "promise"], function() {
    var projectsApp = angular.module('projectsApp', ['ngRoute']);

	projectsApp.controller("SubmissionListCtrl", function($scope, ProjectService) {
		console.log('in controller');
		ProjectService.list().then(function(responce){
			$scope.$apply(function () {
		        $scope.submissions = responce;
		    });
		}, function(err){
			console.log('error');
		});
	});

	// ProjectStore.init returns promise, which when resolved the 
	// controller will be invoked.
	projectsApp.config(['$routeProvider',
		function($routeProvider) {
			$routeProvider
				.when('/', {
					controller: 'SubmissionListCtrl',
					template: '<table> <tr ng-repeat="sub in submissions"> <td> <a href=\"submission.html?_id={{sub.timeStamp}}\">{{sub.timeStamp}}</a> </td> <td> {{ sub.xml }} </td> </tr> </table>'
					// resolve: {
					// 	'ProjectService': function(ProjectService) {
					// 		return ProjectService.init();
					// 	}
					// }
				})
		}
	]);

	projectsApp.service('ProjectService', function() {
		// JS standard pattern defining Project service.
		return ProjectStore;
	});

	//angular.bootstrap( document.getElementsByTagName("body")[0], [ 'projectsApp' ]);
    return projectsApp;
});

// include and execute jQuery
require(["app"], function() {

	// This needs to be done in a more cleaner way.
	ProjectStore.init().then(function(){
		angular.bootstrap( document.getElementsByTagName("body")[0], [ 'projectsApp' ]);
	}, function(err){
		// store failed
		console.log('Error: init'+ err);
	});


	//angular.bootstrap( document.getElementsByTagName("body")[0], [ 'projectsApp' ]);
	// angular.element(document).ready(function() {
	// 	angular.bootstrap( document.getElementsByTagName("body")[0], [ 'projectsApp' ]);
 //        //angular.bootstrap(document, ['app']);
 //    });
});






