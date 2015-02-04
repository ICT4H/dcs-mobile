var submissionConflictResolverController = function($scope, $routeParams, $location, dcsService, submissionDao, msg, app) {
   
    var project_uuid = $routeParams.project_uuid;
    var submission_uuid = $routeParams.submission_uuid;
    $scope.conflictView = [];
    $scope.title = resourceBundle.conflict_resolver_title;

    var onload = function() {
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        dcsService.getSubmissionById(project_uuid, submission_uuid).then(function(serverSubmission) {
            serverSubmission.data = JSON.parse(serverSubmission.data);
            $scope.serverSubmission = serverSubmission;
            submissionDao.getSubmissionByuuid(submission_uuid).then(function(localSubmission) {
                localSubmission.data = JSON.parse(localSubmission.data);
                $scope.localSubmission = localSubmission;
                getConflictDict($scope.serverSubmission, localSubmission);
            });
        });
    };

    var getConflictDict = function(serverSubmission, localSubmission) {
        angular.forEach(serverSubmission.data, function(value, key) {
            var serverValue = serverSubmission.data[key];
            var localValue = localSubmission.data[key];

            var view = "<td>" + key + "</td><td>" + serverValue + "</td><td>" + localValue + "</td>";
            $scope.conflictView.push(view);
        }); 
        msg.hideAll();  
    };

    $scope.applyServerChanges = function() {
        msg.showLoadingWithInfo(resourceBundle.appling_changes);
        $scope.serverSubmission.status = "both";
        $scope.serverSubmission.submission_id = $scope.localSubmission.submission_id;
        $scope.serverSubmission.data = JSON.stringify($scope.serverSubmission.data);
        submissionDao.updateSubmission($scope.serverSubmission).then(function(response) {
            msg.hideLoadingWithInfo(resourceBundle.applied_server);
        });
    };  

    $scope.applyLocalChanges = function() {
        msg.showLoadingWithInfo(resourceBundle.appling_changes);
        submissionDao.updateSubmissionStatus([submission_uuid], "modified").then(function() {
           submissionDao.updateVersion(submission_uuid, $scope.serverSubmission.version).then(function() {
                msg.hideLoadingWithInfo(resourceBundle.applied_local);
           });
        });
    };

    onload();
};
dcsApp.controller('submissionConflictResolverController', ['$scope', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'app', submissionConflictResolverController]);