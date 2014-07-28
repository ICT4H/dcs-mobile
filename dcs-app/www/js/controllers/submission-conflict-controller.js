dcsApp.controller('submissionConflictController', ['$rootScope', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'localStore', 'messageService',
    function($rootScope, $scope, $q, $routeParams, $location, dcsService, localStore, msg){

    msg.showLoadingWithInfo('Loading submissions');

    $scope.selectLocal = false;

    $scope.takeLocal = function(row) {
        //$scope.resolvedSubmission
        console.log('take local value');
        $scope.selectLocal = true;
    }

    $scope.takeServer = function(row) {
        console.log('take server value');
        $scope.selectLocal = false;
    }

    $scope.save = function() {
        if ($scope.selectLocal) {
            localStore.updateSubmissionVersionAndStatus($scope.localSubmission.submission_id, $scope.serverSubmission.version, BOTH);
            localStore.updateSubmissionCreatedDate($scope.localSubmission.submission_id, $scope.serverSubmission.created);
            msg.displaySuccess('Local changes taken');
        } else {
            localStore.updateSubmission($scope.localSubmission.submission_id, $scope.serverSubmission);
            localStore.updateSubmissionCreatedDate($scope.localSubmission.submission_id, $scope.serverSubmission.created);

            msg.displaySuccess('Server changes taken');
        }
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
                        	$scope.serverSubmission	= serverSubmission;    				
		    				$scope.serverSubmissionData = JSON.parse(serverSubmission.data);
		    				msg.hideAll();
		    			});
		    	});
    });
}]);