var submissionListController = function($rootScope, app, $scope, $q, $routeParams, $location, dcsService, submissionDao, msg, paginationService, dialogService, contextService){

    $scope.pagination = paginationService.pagination;
    $scope.actions = [];
    $scope.searchFields = {all: 'All'};  
    var searchStr = $routeParams.searchStr;
    var MODIFIED = 1;
    var UNMODIFIED = 0;
    var selectedCount = 0;  
    var serverSubmissions = [];
    var selectedSubmission = [];
    $scope.conflictSubmissionCount = 0;
    $scope.showAdvanceSearch = false;
    var type = $routeParams.type || "all";
    $scope.filteredBy = ({all: 'local', unsubmitted: 'unsubmitted', conflicted: 'conflicted'})[type]

    $scope.project_uuid = $routeParams.project_uuid;
    $scope.outdateProject = false;
    $scope.deletedProject = false;
    $scope.showSearch = false;
    $scope.project_name = contextService.getProject().name;

    $scope.flipSearch = function() {
        $scope.showSearch = !$scope.showSearch;
    };

    var assignSubmissions = function(submissions){
        $scope.showAdvanceSearch = false;
        selectedSubmission = [];
        $scope.pagination.totalElement = submissions.total;
        $scope.submissions = submissions.data;
        $scope.title =  type + " data";
        msg.hideAll();
    };

    var ErrorLoadingSubmissions = function(data, error) {
        msg.hideLoadingWithErr(resourceBundle.failed_to_load_data);
    };

    $scope.setPathForView = function(submissionId, isFromServer, index) {
        var actualIndex = ($scope.pagination.pageSize * $scope.pagination.pageNumber) + index ;
        var queryParams = 'type=' + type + '&currentIndex=' + index + '&server=' + isFromServer + '&searchStr=' + (searchStr || "");
        $location.url('/projects/' + $scope.project_uuid  + '/submissions/'+ submissionId + '?' + queryParams);
    };

    $scope.ApplyFilterWith = function(option) {
        $location.url('/submission-list/' + $scope.project_uuid + '?type=' + option);
    };

    var loadLocal = function() {
        $scope.serverPage = false;
        $scope.title =  type + " data";
        msg.showLoadingWithInfo(resourceBundle.loading_data);
        initOfflineActions();
        selectedSubmission = [];
        if(type == "server") {
            loadServer();
        } else {
            $scope.pagination.init($rootScope.pageSize.value, 0, function() {
                submissionDao.searchSubmissionsByType($scope.project_uuid, type, searchStr, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignSubmissions, ErrorLoadingSubmissions);
            });
        }
    };

    $scope.search = function(searchString) {
        searchStr = searchString;
        if($scope.serverPage) 
            loadServer()       
        else 
            loadLocal();
    };


    var post_selected_submissions = function(submission_ids) {
        var multiplePromises = [];
        submission_ids.forEach(function(submissionId) {
            multiplePromises.push(
                submissionDao.getSubmissionById(submissionId)
                    .then(dcsService.postSubmissionAndPurgeObsoluteMedia)
                    .then(dcsService.postSubmissionNewMedia)
                    .then(submissionDao.updateSubmission));
        });
        return multiplePromises;
    };

    var onSubmit = function() {
        if(selectedSubmission.length != 0) {
            "data_submit_msg".showInfoWithLoading();
            $q.all(post_selected_submissions(selectedSubmission)).then(function() {
                loadLocal();
            },function(error){
                msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
            });
        }
        else {
            //TODO remove the 100 magic number
            dialogService.confirmBox(resourceBundle.confirm_submit_all_submissions, function() {
                submissionDao.searchSubmissionsByType($scope.project_uuid, 'unsubmitted', '', 0, 100).then(function(result) {
                    if (result.total < 1) {
                        "no_changes_to_submit".showError();
                        return    
                    }
                    
                    var unsubmitted_ids = $scope.pluck(result.data, 'submission_id');
                    "submitting_changes_msg".showInfoWithLoading();
                    $q.all(post_selected_submissions(unsubmitted_ids)).then(function() {
                        loadLocal();
                    },function(error){
                        msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
                    });
                });
            });
        }   
    };

    var onDelete = function() {
        if(selectedSubmission.length == 0) {
            dialogService.confirmBox(resourceBundle.confirm_delete_all_submissions, function() {
                msg.showLoadingWithInfo(resourceBundle.deleting_data);
                fileSystem.deleteUserFolders(app.user.name, [$scope.project_uuid]);
                submissionDao.deleteAllSubmissionOfProject($scope.project_uuid).then(function() {
                    "data_deleted".showInfo();
                    loadLocal();
                }, function(error) {            
                    "failed_data_deletion".showError();
                });
            });
        }   
        else {
            dialogService.confirmBox(resourceBundle.confirm_data_delete, function() {
                msg.showLoadingWithInfo(resourceBundle.deleting_data);
                //TODO need to get the file names string to be deleted
                submissionDao.deleteSubmissions(selectedSubmission).then(function(){
                    var submissionFolders = selectedSubmission.map(function(selectedSubmissionId) {
                        return $scope.project_uuid + '/' + selectedSubmissionId;
                    });
                    fileSystem.deleteUserFolders(app.user.name, submissionFolders);
                    "data_deleted".showInfo();
                    loadLocal();
                }, function(error){
                    "failed_data_deletion".showError();
                });
            });
        }
    };

    var onNew = function() {
        $location.url('/projects/' + $scope.project_uuid + '/submissions/new');
    };

    var initServerActions =  function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onDownload, 'label': 'Download'}); 
    };

    var createSubmissions = function(results) {
        var submissions = [];
        angular.forEach(results, function(item) {
            submissions.push({'date': item[2], 'submission_id': item[0]});
        });
        return submissions;
    };

    var assignServerSubmissions = function(response) {
        selectedSubmission = [];
        msg.hideAll();
        submissions = createSubmissions(response.data);
        $scope.pagination.totalElement = response.total;
        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No server submissions !');

        $scope.submissions = submissions;
    };

    var loadServer = function() {
        $scope.serverPage = true;
        $scope.title =  type + " data";
        selectedSubmission = [];
        msg.showLoadingWithInfo(resourceBundle.loading_data);
        initServerActions();
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            dcsService.getSubmissions($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize, searchStr || "")
            .then(assignServerSubmissions, ErrorLoadingSubmissions);
        });
    };

    var _getFieldsLabelFromXform = function(xform) {
        var xmlDoc = $.parseXML(xform)
        var labels = [];
        questions = xmlDoc.getElementsByTagName('label');
        var filteredQuestions = [];
        for (var i = 0; i < questions.length; i++) {
            if(questions[i].childNodes.length>1)
                filteredQuestions.push(questions[i]);
        }
        for (var i = 0; i < filteredQuestions.length; i++) {
            name = $scope.rest(filteredQuestions[i].getElementsByTagName('input')[0].attributes.name.value.split('/'), 2).join('/');
        label = filteredQuestions[i].getElementsByTagName('span')[0].textContent;
            labels.push({'name': name, 'label': label});
        }
        return labels;
    };

    var _getFieldValue = function(fields, json) {
        fieldValues = json[fields[0]];
        fields = $scope.rest(fields);
        fields.forEach(function(field) {
            fieldValues = $scope.flatten($scope.pluck(fieldValues, field));
        });
        return $scope.flatten([fieldValues]);
    };

    var onAdvanceSearch = function() {
        msg.showLoadingWithInfo("Loading Fields");
        submissionDao.getProjectById($scope.project_uuid).then(function(result) {
            $scope.showAdvanceSearch = true;
            $scope.searchFields = _getFieldsLabelFromXform(result.xform);
            $scope.selectedField = $scope.searchFields[0].name;
            msg.hideAll();
        });
    };

    $scope.searchInField = function(field, searchString) {
        submissionDao.getAllSubmissionOf($scope.project_uuid).then(function(result) {
            var matchedSubmissionsId = [];
            result.forEach(function(submission) {
                fieldValues = _getFieldValue(field.split('/'), JSON.parse(submission.data));
                fieldValues.forEach(function(fieldValue) {
                    if(fieldValue.toLowerCase().indexOf(searchString.toLowerCase()) > -1) 
                        matchedSubmissionsId.push(submission.submission_id); 
                });
            });
            submissionDao.createSearchTable(matchedSubmissionsId).then(function(){
                $scope.pagination.init($rootScope.pageSize.value, 0, function() {
                    type = "search";
                    submissionDao.searchSubmissionsByType($scope.project_uuid, 'search', '', $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                        .then(assignSubmissions, ErrorLoadingSubmissions);
                });
            });
        });
    };

    var initOfflineActions =  function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onNew, 'label': resourceBundle.new});
        $scope.actions.push({'onClick': onSubmit, 'label': resourceBundle.submit});
        $scope.actions.push({'onClick': onDelete, 'label': resourceBundle.delete});
        $scope.actions.push({'onClick': goToServerSubmissions, 'label': resourceBundle.download});
        $scope.actions.push({'onClick': onDeltaPull, 'label': resourceBundle.download_delta});
        $scope.actions.push({'onClick': onAdvanceSearch, 'label': "Advance Search"});
    };

    $scope.onSubmissionSelect = function(submissionRow, submission) {
        submissionRow.selected = !submissionRow.selected;
        app.flipArrayElement(selectedSubmission, submission.submission_id);
    };

    var goToServerSubmissions = function() {
        $location.url('/submission-list/' + $scope.project_uuid + '?type=server');
    };

    $scope.resolveConflict = function(submission_uuid) {
        $location.url('/conflict-resolver/' + $scope.project_uuid + "/" + submission_uuid);
    };

    $scope.onSearchClose = function(searchStr) {
        $scope.search('');
    };

    app.goBack = function() {
        if($scope.showSearch) {
            $scope.showSearch = false;
            $scope.search('');
        }
        else if($scope.serverPage)
            $location.url('/submission-list/' + $scope.project_uuid + '?type=all');
        else
            $location.url('/local-project-list');
    };

    var onDownload = function() {
        if(!app.areItemSelected(selectedSubmission)) return;

        msg.showLoading();
        var deselectingPromises = [];

        selectedSubmission.forEach(function(submission_uuid) {
            deselectingPromises.push(deselectExistingSubmissions(submission_uuid));
        });

        $q.all(deselectingPromises).then(function() {
            console.log('deselecting existing submission done');
            var submissionPromises = downloadSelectedSubmission();
            downloadMediaOfServerSubmissions(submissionPromises).then(function() {
                type = "all";
                loadLocal();
                "data_downloaded".showInfo();
            }, function(error) {
                "download_data_failed".showError();
            });
        });
    };

    function deselectExistingSubmissions(submission_uuid) {
        var deferred = $q.defer();
        submissionDao.getsubmissionUuidByUuid(submission_uuid).then(function(result) {
            if(result.length != 0)
                app.flipArrayElement(selectedSubmission, submission_uuid);
            deferred.resolve();
        }, deferred.reject);
        return deferred.promise;
    };

    var downloadSelectedSubmission = function() {
        console.log('downloading non-existing submissions');
        return selectedSubmission.map(function(submission_uuid) {
            var downloadSubmissionRequest = createDownloadRequest(submission_uuid);
            return dcsService.getSubmission(downloadSubmissionRequest).then(function(serverSubmission) {
                return submissionDao.createSubmission(serverSubmission).then(function() {
                    return serverSubmission;
                });
            });
        });
    };

    function createDownloadRequest(submission_uuid) {
        return {
            submission_uuid: submission_uuid,
            project_uuid: $scope.project_uuid,
            status: BOTH
        };
    }

    var downloadMediaOfServerSubmissions = function(submissionPromises) {
        return submissionPromises.reduce(function(promise, submissionPromise) {
            return promise.then(function() {
                return submissionPromise.then(dcsService.getSubmissionMedia)
                        .then(_moveTempFilesOfServerSubmission);
            });
        }, $q.when());
    };

    var onDeltaPull = function() {
        "downloading_delta".showInfoWithLoading();

        var deltaPromise = getDeltaPromise();
        deltaPromise.then(function() {
            console.log('delta pull done; loading local submissions');
            loadLocal();
            "done".showInfo();
        }, function() {
            msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
        });
    };

    var getDeltaPromise = function() {
        var deferred = $q.defer();
        submissionDao.getLastFetch($scope.project_uuid).then(function(result) {
            dcsService.getSubmissionsFrom($scope.project_uuid, result.last_fetch).then(function(serverResult) {
                submissionDao.updatelastFetch($scope.project_uuid, serverResult.last_fetch).then(function() {
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
        var partialPath = $scope.project_uuid + '/' + submissionId;
        return fileSystem.moveTempFilesToFolder(app.user.name, partialPath);
    };

    loadLocal();
};

dcsApp.controller('submissionListController', ['$rootScope', 'app', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'paginationService', 'dialogService', 'contextService', submissionListController]);

