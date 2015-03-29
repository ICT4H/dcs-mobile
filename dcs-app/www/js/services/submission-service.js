dcsApp.service('submissionService', ['$rootScope', '$q' ,'app', 'submissionDao', 'dcsService', 'dialogService',  function($rootScope, $q, app, submissionDao, dcsService, dialogService) {

    var projectUuid, downloadMedia;

    this.processDeltaSubmissionsWithoutMedia = function(currentProjectUuid) {
        downloadMedia = false;
        return processDeltaSubmissions(currentProjectUuid);
    };

    this.processDeltaSubmissions = function(currentProjectUuid) {
        downloadMedia = true;
        return processDeltaSubmissions(currentProjectUuid);
    };

    this.downloadSelectedSubmission = function(selectedSubmission, currentProjectUuid) {
        downloadMedia = true;
        return downloadSelectedSubmission(selectedSubmission, currentProjectUuid);
    };

    this.downloadSelectedSubmissionWithoutMedia = function(selectedSubmission, currentProjectUuid) {
        downloadMedia = false;
        return downloadSelectedSubmission(selectedSubmission, currentProjectUuid);
    };

    this.submitAllOrSelectedIds = function(projectUuid, selectedSubmissionIds) {
        var deferred = $q.defer();
        var isDataSelected = selectedSubmissionIds && selectedSubmissionIds.length != 0

        dialogService.confirmBox(resourceBundle.confirm_to_submit, function() {
            if(isDataSelected) {
                submitSelected(deferred, selectedSubmissionIds);
            } else {
                submitAll(projectUuid, deferred);
            }
        }, deferred.resolve);

        return deferred.promise;
    }

    function submitSelected(deferred, selectedSubmissionIds) {
        $q.all(postSelectedSubmissions(selectedSubmissionIds)).then(deferred.resolve, deferred.reject);
    }

    function submitAll(projectUuid, deferred) {
        //TODO remove the 100 magic number
        submissionDao.searchSubmissionsByType(projectUuid, 'unsubmitted', '', 0, 100).then(function(result) {
            var unsubmittedIds = $rootScope.pluck(result.data, 'submission_id');
            $q.all(postSelectedSubmissions(unsubmittedIds)).then(deferred.resolve, deferred.reject);
        });
    }

    var postSelectedSubmissions = function(submissionIds) {
        if (submissionIds.length < 1) return $.when();

        var multiplePromises = [];
        submissionIds.forEach(function(submissionId) {
            multiplePromises.push(
                submissionDao.getSubmissionById(submissionId)
                    .then(dcsService.postSubmissionAndPurgeObsoluteMedia)
                    .then(dcsService.postSubmissionNewMedia)
                    .then(submissionDao.updateSubmission));
        });
        return multiplePromises;
    };

    function downloadSelectedSubmission(selectedSubmission, currentProjectUuid) {
        console.log('downloading non-existing submissions with downloadMedia: ' + downloadMedia);
        projectUuid = currentProjectUuid;
        var downloadedSubmission = downloadAndSave(selectedSubmission);
        return downloadMediaOfServerSubmissions(downloadedSubmission);
    };

    var processDeltaSubmissions = function(currentProjectUuid) {
        console.log('delta pull with downloadMedia: ' + downloadMedia);
        projectUuid = currentProjectUuid;
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
        }).catch(deferred.reject);
        return deferred.promise;
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