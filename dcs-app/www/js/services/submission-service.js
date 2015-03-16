dcsApp.service('submissionService', ['$rootScope', '$q' ,'app', 'submissionDao', 'dcsService',  function($scope, $q, app, submissionDao, dcsService) {

    var projectUuid, downloadMedia;

    this.processDeltaSubmissions = function(current_project_uuid, downloadMediaFiles) {
        projectUuid = current_project_uuid;
        downloadMedia = downloadMediaFiles;
        console.log('downloadMedia is ' + downloadMedia + ' changing to false');
        downloadMedia = false;
        var deferred = $q.defer();

        submissionDao.getLastFetch(projectUuid).then(function(result) {
            dcsService.getSubmissionsFrom(projectUuid, result.last_fetch).then(function(serverResult) {
                submissionDao.updatelastFetch(projectUuid, serverResult.last_fetch).then(function() {
                    var allIdsFromServer = Object.keys(serverResult.submissions, 'submission_uuid');
                    submissionDao.getModifiedAndUnModifiedUuids(allIdsFromServer).then(function(localResult) {
                        var deltaPromise = updateLocalWithServerDelta(localResult, serverResult);
                        deferred.resolve(deltaPromise);
                    });
                });
            });
        });
        return deferred.promise;
    };

    this.downloadSelectedSubmission = function(selectedSubmission, current_project_uuid, downloadMediaFiles) {
        console.log('downloading non-existing submissions');
        projectUuid = current_project_uuid;
        downloadMedia = false;
        return downloadAndSave(selectedSubmission)
            .then(downloadMediaOfServerSubmissions);
    };

    var downloadAndSave = function(selectedSubmission) {
        // TODO this is not giving back promise.
       var promises = selectedSubmission.map(function(submissionUuid) {
            var downloadSubmissionRequest = createDownloadRequest(submissionUuid);
            dcsService.getSubmission(downloadSubmissionRequest).then(function(serverSubmission) {
                submissionDao.createSubmission(serverSubmission).then(function() {
                    return serverSubmission;
                });
            });
        });
        return $q.all(promises);
    }

    var downloadMediaOfServerSubmissions = function(submissionPromises) {
        if (!downloadMedia) return $q.when();

        return submissionPromises.reduce(function(promise, submissionPromise) {
            return promise.then(function() {
                return submissionPromise.then(dcsService.getSubmissionMedia)
                        .then(_moveTempFilesOfServerSubmission);
            });
        }, $q.when());
    };

    function createDownloadRequest(submissionUuid) {
        return {
            submission_uuid: submissionUuid,
            project_uuid: projectUuid,
            status: BOTH
        };
    }

    function updateLocalWithServerDelta(localResult, serverResult) {
        var updatePromises = [];
        var allIdsFromServer = Object.keys(serverResult.submissions, 'submission_uuid');

        var conflictUuids = $scope.pluck(localResult.modifiedUuids, 'submission_uuid');
        var updateUuids = $scope.pluck(localResult.unModifiedUuids, 'submission_uuid');
        var alreadyInConflictUuids = $scope.pluck(localResult.conflictedUuids, 'submission_uuid');
        var idsWithoutLocalConflicts = $scope.difference(allIdsFromServer, alreadyInConflictUuids);

        var newUuids = $scope.difference($scope.difference(idsWithoutLocalConflicts, conflictUuids), updateUuids);
        var newSubmissionsPro = addNewSubmissions(newUuids, serverResult);
        console.log('conflictUuids: ' + conflictUuids);
        var conflictSubmissionsPro = submissionDao.updateSubmissionStatus(conflictUuids, 'conflicted');
        var updateSubmissionsPro = updateChangedSubmissions(updateUuids, serverResult);

        var mediaPromise = downloadMediaOfServerSubmissions(newSubmissionsPro.concat(updateSubmissionsPro));

        updatePromises.concat(newSubmissionsPro, updateSubmissionsPro, conflictSubmissionsPro,
            [mediaPromise]);
        return $q.all(updatePromises);
    }

    var addNewSubmissions = function(newUuids, result) {
        console.log('newUuids: ' + newUuids);
        return newUuids.map(function (newUuid) {
            var submission = result.submissions[newUuid];
            submission.status = "both";
            return submissionDao.createSubmission(submission).then(function() {
                return submission;
            });
        });
    };

    var updateChangedSubmissions = function(updateUuids, result) {
        console.log('updateUuids: ' + updateUuids);
        return updateUuids.map(function (updateUuid) {
            var submission = result.submissions[updateUuid];
            submission.status = "both";
            return submissionDao.updateSubmissionUsingUuid(submission).then(function() {
                return submission;
            });
        });
    };

    var _moveTempFilesOfServerSubmission = function(submission) {
        return submissionDao.getsubmissionIdByUuid(submission.submission_uuid).then(function(result) {
            return _moveMediaToSubmissionFolder(result[0].submission_id);
        });
    };

    var _moveMediaToSubmissionFolder = function(submissionId) {
        console.log('moving files for submission_id: ' + submissionId);
        var partialPath = projectUuid + '/' + submissionId;
        return fileSystem.moveTempFilesToFolder(app.user.name, partialPath);
    };

}]);