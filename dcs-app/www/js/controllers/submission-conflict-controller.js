dcsApp.controller('submissionConflictController', ['$rootScope', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'localStore', 'messageService',
    function($rootScope, $scope, $q, $routeParams, $location, dcsService, localStore, msg){

    msg.showLoadingWithInfo('Loading submissions');

    $scope.takeLocal = function(row) {
        //$scope.resolvedSubmission
        console.log('take local value');
        $scope.resolvedSubmission[row.key] = $scope.localSubmission.data[row.key];
        console.log('resolvedSubmission: ' + JSON.stringify($scope.resolvedSubmission));
    }

    $scope.takeServer = function(row) {
        console.log('take server value');
        $scope.resolvedSubmission[row.key] = $scope.serverSubmission[row.key];
        console.log('resolvedSubmission: ' + JSON.stringify($scope.resolvedSubmission));
    }

    localStore.getProjectById($routeParams.project_id)
        .then(function(project) {
            $scope.project_name = project.name;
            $scope.headers = JSON.parse(project.headers);
            delete $scope.headers.ds_name;
            delete $scope.headers.date;

		    localStore.getSubmissionById($routeParams.submission_id)
		    	.then(function(localSubmission) {
				    
				    $scope.localSubmission = localSubmission;
		    		dcsService.getSubmissionById(project.project_uuid, localSubmission.submission_uuid)
		    			.then(function(serverSubmission) {
		    				
		    				serverSubmission.data = JSON.parse(serverSubmission.data);
		    				$scope.serverSubmission = serverSubmission.data;
		    				$scope.resolvedSubmission = angular.copy(serverSubmission.data);
		    				msg.hideAll();
		    			});
		    	});
    });
}]);