var submissionConflictResolverController = function($scope, $routeParams, $location, dcsService, submissionDao, msg, app) {
   
    var exculdeHeaders = {'ds_name': 'ds_name', 'date':'date'};
    var project_uuid = $routeParams.project_uuid;
    var submission_uuid = $routeParams.submission_uuid;
    $scope.conflictDict = {};
    
    var onload = function() {
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        dcsService.getSubmissionById(project_uuid, submission_uuid).then(function(serverSubmission) {
            serverSubmission.data = JSON.parse(serverSubmission.data);
            $scope.serverSubmission = serverSubmission;
            submissionDao.getSubmissionByuuid(submission_uuid).then(function(localSubmission) {
                localSubmission[0].data = JSON.parse(localSubmission[0].data);
                $scope.localSubmission = localSubmission[0];
                submissionDao.getProjectById(project_uuid).then(function(project) {
                    getConflictDict(JSON.parse(project.headers), $scope.serverSubmission.data, $scope.localSubmission);
                });
            });
        });
    };

    var getConflictDict = function(headers, serverSubmission, localSubmission) {
        angular.forEach(headers, function(value, key) { 
            $scope.conflictDict[key] = {'server': serverSubmission[key], 'local': localSubmission[key]};
        }); 
        msg.hideAll();  
    };

    $scope.applyServerChanges = function() {
        msg.showLoadingWithInfo("Appling Changes");
        $scope.serverSubmission.status = "new";
        $scope.serverSubmission.is_modified = false;
        $scope.serverSubmission.submission_id = $scope.localSubmission.submission_id;
        submissionDao.updateSubmission($scope.serverSubmission).then(function(response) {
            msg.hideLoadingWithInfo("Applied server changes.");
        });
    };

    $scope.applyLocalChanges = function() {
        msg.showLoadingWithInfo("Appling Changes");
        submissionDao.updateSubmissionStatus(submission_uuid, "new").then(function() {
           submissionDao.updateVersion(submission_uuid, $scope.serverSubmission.version).then(function() {
                msg.hideLoadingWithInfo("Applied local changes.");
           });
        });
    };

    onload();
};
dcsApp.controller('submissionConflictResolverController', ['$scope', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'app', submissionConflictResolverController]);