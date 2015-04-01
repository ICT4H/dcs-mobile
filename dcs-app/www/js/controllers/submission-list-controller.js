var submissionListController = function($rootScope, app, $scope, $q, $routeParams, $location, dcsService, submissionDao, msg, paginationService, dialogService, contextService, submissionService){

    $scope.pagination = paginationService.pagination;
    $scope.actions = [];
    $scope.searchFields = {all: 'All'};  
    $scope.showAdvanceSearch = false;
    var type = $routeParams.type || 'all';
    $scope.filteredBy = ({all: 'local', unsubmitted: 'unsubmitted', conflicted: 'conflicted'})[type]
    $scope.project_uuid = $routeParams.project_uuid;
    $scope.showSearch = false;
    var project = contextService.getProject();
    $scope.project_name = project.name;

    var searchStr = $routeParams.searchStr;
    var selectedSubmission = [];

    loadLocal();

    $scope.flipSearch = function() {
        $scope.showSearch = !$scope.showSearch;
    };

    $scope.onView = function(submissionId, isFromServer, index) {
        var actualIndex = ($scope.pagination.pageSize * $scope.pagination.pageNumber) + index ;
        var queryParams = 'type=' + type + '&currentIndex=' + index + '&server=' + isFromServer + '&searchStr=' + (searchStr || "");
        $location.url('/projects/' + $scope.project_uuid  + '/submissions/'+ submissionId + '?' + queryParams);
    };

    $scope.ApplyFilterWith = function(option) {
        $location.url('/submission-list/' + $scope.project_uuid + '?type=' + option);
    };

    $scope.onSearchClose = function(searchStr) {
        $scope.search('');
    };

    $scope.search = function(searchString) {
        searchStr = searchString;
        if($scope.serverPage) 
            loadServer()       
        else 
            loadLocal();
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
                    type = 'search';
                    submissionDao.searchSubmissionsByType($scope.project_uuid, 'search', '', $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                        .then(assignSubmissions, ErrorLoadingSubmissions);
                });
            });
        });
    };

    $scope.onSubmissionSelect = function(submissionRow, submission) {
        submissionRow.selected = !submissionRow.selected;
        app.flipArrayElement(selectedSubmission, submission.submission_id);
    };

    $scope.onResolveConflict = function(submission_uuid) {
        $location.url('/conflict-resolver/' + $scope.project_uuid + '/' + submission_uuid);
    };

    var initOfflineActions =  function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onNew, 'label': resourceBundle.new});
        $scope.actions.push({'onClick': onSubmit, 'label': resourceBundle.submit});
        $scope.actions.push({'onClick': onDelete, 'label': resourceBundle.delete});
        $scope.actions.push({'onClick': goToServerSubmissions, 'label': resourceBundle.download});
        $scope.actions.push({'onClick': onDeltaPull, 'label': resourceBundle.download_delta});
        $scope.actions.push({'onClick': onAdvanceSearch, 'label': 'Advance Search'});
    };

    var initServerActions =  function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onDownload, 'icon': 'fa-download'});
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

    function loadLocal() {
        $scope.serverPage = false;
        $scope.title =  type + ' data';
        msg.showLoadingWithInfo(resourceBundle.loading_data);
        initOfflineActions();
        selectedSubmission = [];
        if(type == 'server') {
            loadServer();
        } else {
            $scope.pagination.init($rootScope.pageSize.value, 0, function() {
                submissionDao.searchSubmissionsByType($scope.project_uuid, type, searchStr, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignSubmissions, ErrorLoadingSubmissions);
            });
        }
    };

    function loadServer() {
        $scope.serverPage = true;
        $scope.title =  type + ' data';
        selectedSubmission = [];
        msg.showLoadingWithInfo(resourceBundle.loading_data);
        initServerActions();
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            dcsService.getSubmissions($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize, searchStr || "")
            .then(assignServerSubmissions, ErrorLoadingSubmissions);
        });
    };

    function assignSubmissions(submissions){
        $scope.showAdvanceSearch = false;
        selectedSubmission = [];
        $scope.pagination.totalElement = submissions.total;
        $scope.submissions = submissions.data;

        $scope.title =  type + ' data';
        msg.hideAll();
    };

    function ErrorLoadingSubmissions(data, error) {
        msg.hideLoadingWithErr(resourceBundle.failed_to_load_data);
    };

    function errorSubmitting() {
        msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
    }

    function onSubmit() {
        'data_submit_msg'.showInfoWithLoading();
        submissionService.submitAllOrSelectedIds($scope.project_uuid, selectedSubmission).then(loadLocal, errorSubmitting);
    };

    function goToServerSubmissions() {
        $location.url('/submission-list/' + $scope.project_uuid + '?type=server');
    };

    function onDelete() {
        if(selectedSubmission.length == 0) {
            dialogService.confirmBox(resourceBundle.confirm_delete_all_submissions, function() {
                msg.showLoadingWithInfo(resourceBundle.deleting_data);
                fileSystem.deleteUserFolders(app.user.name, [$scope.project_uuid]);
                submissionDao.deleteAllSubmissionOfProject($scope.project_uuid).then(function() {
                    'data_deleted'.showInfo();
                    loadLocal();
                }, function(error) {            
                    'failed_data_deletion'.showError();
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
                    'data_deleted'.showInfo();
                    loadLocal();
                }, function(error){
                    'failed_data_deletion'.showError();
                });
            });
        }
    };

    function onNew() {
        $location.url('/projects/' + $scope.project_uuid + '/submissions/new');
    };

    function createSubmissions(results) {
        var submissions = [];
        angular.forEach(results, function(item) {
            submissions.push({'date': item[2], 'submission_id': item[0]});
        });
        return submissions;
    };

    function assignServerSubmissions(response) {
        selectedSubmission = [];
        msg.hideAll();
        submissions = createSubmissions(response.data);
        $scope.pagination.totalElement = response.total;
        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No server submissions !');

        $scope.submissions = submissions;
    };

    function _getFieldsLabelFromXform(xform) {
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

    function _getFieldValue(fields, json) {
        fieldValues = json[fields[0]];
        fields = $scope.rest(fields);
        fields.forEach(function(field) {
            fieldValues = $scope.flatten($scope.pluck(fieldValues, field));
        });
        return $scope.flatten([fieldValues]);
    };

    function onAdvanceSearch() {
        msg.showLoadingWithInfo('Loading Fields');
        submissionDao.getProjectById($scope.project_uuid).then(function(result) {
            $scope.showAdvanceSearch = true;
            $scope.searchFields = _getFieldsLabelFromXform(result.xform);
            $scope.selectedField = $scope.searchFields[0].name;
            msg.hideAll();
        });
    };

    function onDownload() {
        if(!app.areItemSelected(selectedSubmission)) return;

        msg.showLoading();
        var deselectingPromises = [];

        selectedSubmission.forEach(function(submission_uuid) {
            deselectingPromises.push(deselectExistingSubmissions(submission_uuid));
        });

        $q.all(deselectingPromises).then(function() {
            console.log('deselecting existing submission done');

            if (! projectHasMedia()) {
                performDownloadWithoutMediaFiles().then(postDownload, downloadFailed);
                return;
            }
            dialogService.confirmBox(resourceBundle.confirm_media_download, function() {
                performDownload().then(postDownload, downloadFailed);
            }, function() {
                performDownloadWithoutMediaFiles().then(postDownload, downloadFailed);
            })
        });
    };

    function performDownload() {
        return submissionService.downloadSelectedSubmission(selectedSubmission, $scope.project_uuid)
    }

    function performDownloadWithoutMediaFiles(downloadMedia) {
        return submissionService.downloadSelectedSubmissionWithoutMedia(selectedSubmission, $scope.project_uuid)
    }

    function postDownload() {
        type = 'all';
        loadLocal();
    }

    function downloadFailed() {
        'download_data_failed'.showError();
    }

    function deselectExistingSubmissions(submission_uuid) {
        var deferred = $q.defer();
        submissionDao.getsubmissionUuidByUuid(submission_uuid).then(function(result) {
            if(result.length != 0)
                app.flipArrayElement(selectedSubmission, submission_uuid);
            deferred.resolve();
        }, deferred.reject);
        return deferred.promise;
    };

    function projectHasMedia() {
        return project.has_media_field == 'true';
    }

    function onDeltaPull() {
        if (! projectHasMedia()) {
            deltaDownLoadWithoutMedia().then(postDownload, deltaDownloadFailed)
            return;
        }

        dialogService.confirmBox(resourceBundle.confirm_media_download, function() {
            deltaDownLoad().then(postDownload, deltaDownloadFailed)
        }, function() {
            deltaDownLoadWithoutMedia().then(postDownload, deltaDownloadFailed)
        });
    };

    function deltaDownLoadWithoutMedia() {
        msg.showLoading();
        return submissionService.processDeltaSubmissionsWithoutMedia($scope.project_uuid);
    }

    function deltaDownLoad() {
        msg.showLoading();
        return submissionService.processDeltaSubmissions($scope.project_uuid);
    }

    function deltaDownloadFailed() {
        msg.hideLoadingWithErr(resourceBundle.error_in_connecting);
    }
};

dcsApp.controller('submissionListController', ['$rootScope', 'app', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'paginationService', 'dialogService', 'contextService', 'submissionService', submissionListController]);

