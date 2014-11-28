dcsApp.controller('fake-ctrl', ['$scope', 'dummyService', function($scope, $dummyService) {
	console.log('in fake-ctrl' + $scope.resourceBundle.fetching_projects);
	$dummyService.bar().then(function(result) {
		$scope.foo = result;
	});

}]);

dcsApp.service('dummyService', ['$q', function($q) {
	this.bar = function() {
		var deferred = $q.defer();

		deferred.resolve('done');

		return deferred.promise;
	}
}]);