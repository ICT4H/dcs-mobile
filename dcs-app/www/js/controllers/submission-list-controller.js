var submissionListController = function($rootScope, app, $scope, $q, $routeParams, $location, dcsService, submissionDao, msg, paginationService, dialogService, locationService){

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
    
    var type = $routeParams.type || "all";
    $scope.project_uuid = $routeParams.project_uuid;
    $scope.outdateProject = false;
    $scope.deletedProject = false;
    $scope.showSearch = false;
    backHandler.setToProjects();

    $scope.flipSearch = function() {
        $scope.showSearch = !$scope.showSearch;
    };

    var assignSubmissions = function(submissions){
        selectedSubmission = [];
        $scope.pagination.totalElement = submissions.total;
        $scope.submissions = submissions.data;
        msg.hideAll();
    };

    var ErrorLoadingSubmissions = function(data, error) {
        msg.hideLoadingWithErr('Failed to load Submissions');
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
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
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

    $scope.search = function(searchStr) {
        $location.url('/submission-list/' + $scope.project_uuid + '?type=' + type + '&searchStr=' + searchStr);
    };

    var OnDeltaPull = function() {
       
        var promises = [];
        
        submissionDao.getLastFetch($scope.project_uuid).then(function(result) {
            msg.showLoadingWithInfo("Fetching submissions.....");
            dcsService.getSubmissionsFrom($scope.project_uuid, result.last_fetch).then(function(result) {
                
                var newSubmissionsPro = result.new_submissions.map(function(submission) {
                    submission.status = "both";
                    return submissionDao.createSubmission(submission);
                });

                var updatedSubmissionUuids = {};
                result.updated_submissions.forEach(function(submission) {
                    updatedSubmissionUuids[submission.submission_uuid] = submission;
                });
                
                var ids = Object.keys(updatedSubmissionUuids);
                
                submissionDao.getSubmissionForConflictCheck(ids).then(function(submissions) {
                    
                    conflictSubmissionsPro = submissions.conflicted.map(function(submission) {
                        return submissionDao.updateSubmissionStatus([submission.submission_uuid], 'conflicted');
                    });

                    updateSubmissionsPro = submissions.nonConflicted.map(function(localSubmission) {
                        var submission = updatedSubmissionUuids[localSubmission.submission_uuid];
                        submission.submission_id = localSubmission.submission_id;
                        return submissionDao.updateSubmission(submission);
                    });

                    promises.concat(newSubmissionsPro, updateSubmissionsPro, conflictSubmissionsPro);
                    app.promises(promises, function() {
                        submissionDao.updatelastFetch($scope.project_uuid, result.last_fetch).then(function() {
                            loadLocal(); 
                            msg.hideLoadingWithInfo("submissions updated.");
                        });
                    });
                });
            });
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

    var post_selected_submissions = function() {
        var multiplePromises = [];
        selectedSubmission.forEach(function(submissionId) {
            multiplePromises.push(
                submissionDao.getSubmissionById(submissionId)
                    .then(dcsService.postSubmissionAndPurgeObsoluteMedia)
                    .then(dcsService.postSubmissionNewMedia)
                    .then(submissionDao.updateSubmission));
        });
        return multiplePromises;
    };

    var onPost = function() {
        if(!app.areItemSelected(selectedSubmission)) return;

        msg.showLoading();
        $q.all(post_selected_submissions())
        .then(function(){
            msg.hideLoadingWithInfo('Submitted successfully');
            loadLocal();
        },function(error){
            console.log(error);
            msg.hideLoadingWithErr('something went wrong ' + error);
        });
    };

    var onDelete = function() {
        if(!app.areItemSelected(selectedSubmission)) return;
         
         dialogService.confirmBox('Do you want to delete selected submissions?', function() {
            submissionDao.deleteSubmissions(selectedSubmission)
            .then(function(){
                msg.hideLoadingWithInfo("Submission(s) deleted");
                loadLocal();
            }
            ,function(error){
                msg.hideLoadingWithErr("Submission(s) deletion failed "+error)
            });
        });
    };

    var onNew = function() {
        $location.path('/projects/' + $scope.project_uuid + '/submissions/new');
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
        msg.showLoading();
        var localSubmissionPromises = [];
        var downloadSubmissionPromises = [];

        selectedSubmission.forEach(function(submission_uuid) {
            localSubmissionPromises.push(loadLocalSubmissionUuid(submission_uuid));
        });

        if(selectedSubmission.length == 0) 
            msg.hideLoadingWithInfo("All submissions are downloaded");

        $q.all(localSubmissionPromises).then(function() {
            
            selectedSubmission.forEach(function(submission_uuid){
                downloadSubmissionPromises.push(
                    downloadSubmission({submission_uuid: submission_uuid,
                                        project_uuid: $scope.project_uuid}));
            });

            $q.all(downloadSubmissionPromises).then(function(){
                msg.hideLoadingWithInfo("Submission downloaded.");
            }, function(error) {
                msg.hideLoadingWithErr('Unable to download submission.');
            });
        });

        // console.log('localSubmissionPromises.length: ' + localSubmissionPromises.length);

        // downloadNonLocalSubmissions(localSubmissionPromises)
        //     .then(function(submissionDownloaders) {

        //         $q.all(submissionDownloaders)
        //             .then(function(results) {
        //                 msg.hideLoadingWithInfo("Submission downloaded.");
        //             }, function(e) {
        //                 msg.hideLoadingWithErr('Unable to download submission.');
        //             });
        //     });
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
        type = "server";
        $scope.title =  type + " data";
        selectedSubmission = [];
        backHandler.setToSubmissions();
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        initServerActions();
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            dcsService.getSubmissions($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize, searchStr || "")
            .then(assignServerSubmissions, ErrorLoadingSubmissions);
        });

    };

    var initOfflineActions =  function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onDelete, 'label': 'Delete' });
        $scope.actions.push({'onClick': onPost, 'label': 'Submit Submissions'});
        $scope.actions.push({'onClick': onNew, 'label': 'Make submission'});
        $scope.actions.push({'onClick': loadServer, 'label': 'Pull Submissions'});
        $scope.actions.push({'onClick': OnDeltaPull, 'label': 'Delta Pull'});
    };

    $scope.onSubmissionSelect = function(submissionRow, submission) {
        submissionRow.selected = !submissionRow.selected;
        app.flipArrayElement(selectedSubmission, submission.submission_id);
    };

    $scope.resolveConflict = function(submission_uuid) {
        $location.url('/conflict-resolver/' + $scope.project_uuid + "/" + submission_uuid);
    };

    $scope.goBack = function() {
        locationService.goBack();
    };

    loadLocal();
};

dcsApp.controller('submissionListController', ['$rootScope', 'app', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'paginationService', 'dialogService', 'locationService', submissionListController]);

