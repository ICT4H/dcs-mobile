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
        loadLocal();
    };

    var onDeltaPull = function() {
       
        var promises = [];
        "downloading_delta".showInfoWithLoading();

        submissionDao.getLastFetch($scope.project_uuid).then(function(result) {
            dcsService.getSubmissionsFrom($scope.project_uuid, result.last_fetch).then(function(result) {
                submissionDao.updatelastFetch($scope.project_uuid, result.last_fetch).then(function() {
                    var allIdsFromServer = Object.keys(result.submissions, 'submission_uuid');
                    submissionDao.getModifiedAndUnModifiedUuids(allIdsFromServer).then(function(localResult) {

                        var conflictUuids = $scope.pluck(localResult.modifiedUuids, 'submission_uuid');
                        var updateUuids = $scope.pluck(localResult.unModifiedUuids, 'submission_uuid');
                        var alreadyInConflictUuids = $scope.pluck(localResult.conflictedUuids, 'submission_uuid');

                        var idsWithoutlocalConflicts = $scope.difference(allIdsFromServer, alreadyInConflictUuids);
                        var newUuids = $scope.difference($scope.difference(idsWithoutlocalConflicts, conflictUuids), updateUuids);

                        var newSubmissionsPro = newUuids.map(function(newUuid) {
                            submission = result.submissions[newUuid];
                            submission.status = "both";
                            return submissionDao.createSubmission(submission);
                        });

                        var conflictSubmissionsPro = submissionDao.updateSubmissionStatus(conflictUuids, 'conflicted');

                        var updateSubmissionsPro = updateUuids.map(function(updateUuid) {
                            var submission = result.submissions[updateUuid];
                            submission.status = "both"
                            return submissionDao.updateSubmissionUsingUuid(submission);
                        });

                        promises.concat(newSubmissionsPro, updateSubmissionsPro, conflictSubmissionsPro);
                        app.promises(promises, function() {
                            loadLocal();
                            "done".showInfo();
                        });
                    });
                });
            }, function() {msg.hideLoadingWithErr(resourceBundle.error_in_connecting);});
        }); 
    };

    // var setObseleteProjectWarning = function(project) {
    //     delete $scope.projectWarning;

    //     if(project.status == OUTDATED) {
    //         $scope.outdateProject = true;
    //         $scope.projectWarning = 'The porject is outdated. You can only submit existing submissions.';
    //     }

    //     if(project.status == SERVER_DELETED) {
    //         $scope.deletedProject = true;
    //         $scope.projectWarning = 'No actions other that delete is premited since project is deleted from server';
    //     }
    // };

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
            dialogService.confirmBox(resourceBundle.confirm_submit_all_submission, function() {
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
        if(!app.areItemSelected(selectedSubmission)) return;
         
         dialogService.confirmBox(resourceBundle.confirm_data_delete, function() {
            submissionDao.deleteSubmissions(selectedSubmission).then(function(){
                "data_deleted".showInfo();
                loadLocal();
            }, function(error){
                "failed_data_deletion".showError();
            });
        });
    };

    var onNew = function() {
        $location.url('/projects/' + $scope.project_uuid + '/submissions/new');
    };

    function loadLocalSubmissionUuid(submission_uuid) {
        var deferred = $q.defer();
        submissionDao.getsubmissionUuidByUuid(submission_uuid).then(function(result) {
            if(result.length != 0)
                app.flipArrayElement(selectedSubmission, submission_uuid);
            deferred.resolve();
        }, deferred.reject);
        return deferred.promise;
    };

    var downloadSubmission = function(submission) {
        submission.status = BOTH;
        return dcsService.getSubmission(submission)
            .then(dcsService.getSubmissionMedia)
            .then(submissionDao.createSubmission);      
    };

    var onDownload = function() {
        if(!app.areItemSelected(selectedSubmission)) return;

        msg.showLoading();
        var localSubmissionPromises = [];
        var downloadSubmissionPromises = [];

        selectedSubmission.forEach(function(submission_uuid) {
            localSubmissionPromises.push(loadLocalSubmissionUuid(submission_uuid));
        });

        $q.all(localSubmissionPromises).then(function() {
            
            selectedSubmission.forEach(function(submission_uuid){
                downloadSubmissionPromises.push(
                    downloadSubmission({submission_uuid: submission_uuid,
                                        project_uuid: $scope.project_uuid}));
            });

            $q.all(downloadSubmissionPromises).then(function(){
                type="all";
                loadLocal();
                "data_downloaded".showInfo();
            }, function(error) {
                "download_data_failed".showError();
            });
        });
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
        var parser = new DOMParser();
        var labels = [];
        xmlDoc = parser.parseFromString(xform,"text/xml");
        questions = xmlDoc.getElementsByClassName('question');

        for (var i = 0; i < questions.length; i++) {
            name = $scope.last(questions[i].getElementsByTagName('input')[0].attributes.name.value.split('/'));
            label = questions[i].getElementsByClassName('question-label')[0].innerHTML
            labels.push({'name': name, 'label': label});
        }
        return labels;
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
            var matchedSubmissionsId =result.map(function(submission) {
                var parser = new DOMParser();
                fieldValue =parser.parseFromString(submission.xml,"text/xml").getElementsByTagName(field)[0].innerHTML;
                if(fieldValue.indexOf(searchString) > -1 )
                    return submission.submission_id;
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

    loadLocal();
};

dcsApp.controller('submissionListController', ['$rootScope', 'app', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'paginationService', 'dialogService', 'contextService', submissionListController]);

