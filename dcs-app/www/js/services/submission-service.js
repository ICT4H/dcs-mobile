dcsApp.service('submissionService', ['$rootScope', '$q' ,'app', 'submissionDao', 'dcsService',  function($rootScope, $q, app, submissionDao, dcsService) {

    var projectUuid, downloadMedia;

    this.processDeltaSubmissions = function(currentProjectUuid, downloadMediaFiles) {
        projectUuid = currentProjectUuid;
        downloadMedia = downloadMediaFiles;
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

    this.downloadSelectedSubmission = function(selectedSubmission, currentProjectUuid, downloadMediaFiles) {
        console.log('downloading non-existing submissions');
        projectUuid = currentProjectUuid;
        downloadMedia = downloadMediaFiles;
        var downloadedSubmission = downloadAndSave(selectedSubmission);
        return downloadMediaOfServerSubmissions(downloadedSubmission);
    };

    function downloadAndSave(selectedSubmission) {
       return selectedSubmission.map(function(submissionUuid) {
           var downloadSubmissionRequest = createDownloadRequest(submissionUuid);
           var deferred = $q.defer();
           return dcsService.getSubmission(downloadSubmissionRequest).then(function (serverSubmission) {
               return submissionDao.createSubmission(serverSubmission).then(function () {
                   return serverSubmission;
               });
           });
        });
    };

    function downloadMediaOfServerSubmissions(submissionPromises) {
        if (!downloadMedia) return $q.all(submissionPromises);

        return submissionPromises.reduce(function(promise, submissionPromise) {
            return promise.then(function() {
                return submissionPromise.then(dcsService.getSubmissionMedia)
                        .then(moveTempFilesOfServerSubmission);
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

        var conflictUuids = $rootScope.pluck(localResult.modifiedUuids, 'submission_uuid');
        var updateUuids = $rootScope.pluck(localResult.unModifiedUuids, 'submission_uuid');
        var alreadyInConflictUuids = $rootScope.pluck(localResult.conflictedUuids, 'submission_uuid');
        var idsWithoutLocalConflicts = $rootScope.difference(allIdsFromServer, alreadyInConflictUuids);

        var newUuids = $rootScope.difference($rootScope.difference(idsWithoutLocalConflicts, conflictUuids), updateUuids);
        var newSubmissionsPro = addNewSubmissions(newUuids, serverResult);
        console.log('conflictUuids: ' + conflictUuids);
        var conflictSubmissionsPro = submissionDao.updateSubmissionStatus(conflictUuids, 'conflicted');
        var updateSubmissionsPro = updateChangedSubmissions(updateUuids, serverResult);

        var mediaPromise = downloadMediaOfServerSubmissions(newSubmissionsPro.concat(updateSubmissionsPro));

        updatePromises.concat(newSubmissionsPro, updateSubmissionsPro, conflictSubmissionsPro,
            [mediaPromise]);
        return $q.all(updatePromises);
    }

    function addNewSubmissions(newUuids, result) {
        console.log('newUuids: ' + newUuids);
        return newUuids.map(function (newUuid) {
            var submission = result.submissions[newUuid];
            submission.status = "both";
            return submissionDao.createSubmission(submission).then(function() {
                return submission;
            });
        });
    };

    function updateChangedSubmissions(updateUuids, result) {
        console.log('updateUuids: ' + updateUuids);
        return updateUuids.map(function (updateUuid) {
            var submission = result.submissions[updateUuid];
            submission.status = "both";
            return submissionDao.updateSubmissionUsingUuid(submission).then(function() {
                return submission;
            });
        });
    };

    function moveTempFilesOfServerSubmission(submission) {
        return submissionDao.getsubmissionIdByUuid(submission.submission_uuid).then(function(result) {
            return moveMediaToSubmissionFolder(result[0].submission_id);
        });
    };

    function moveMediaToSubmissionFolder(submissionId) {
        console.log('moving files for submission_id: ' + submissionId);
        var partialPath = projectUuid + '/' + submissionId;
        return fileSystem.moveTempFilesToFolder(app.user.name, partialPath);
    };

}]);