var submissionListController = function($rootScope, app, $scope, $q, $routeParams, $location, dcsService, submissionDao, msg, paginationService, dialogService){

    $scope.pagination = paginationService.pagination;
    $scope.actions = [];
    
    $scope.searchFields = {all: 'All'};  

    var MODIFIED = 1;
    var UNMODIFIED = 0;
    var selectedCount = 0;
    var serverSubmissions = [];
    var selectedSubmission = [];
    $scope.conflictSubmissionCount = 0;

    var type = $routeParams.type;
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
        var queryParams = 'type=' + type + '&isListing=true&totalElement=' + $scope.pagination.totalElement +'&currentIndex=' + index + '&server=' + isFromServer + '&limit=' + $scope.pagination.pageSize;
        if($scope.searchStr)
            queryParams = queryParams + '&searchStr=' + $scope.searchStr;
        $location.url('/projects/' + $scope.project_uuid  + '/submissions/'+ submissionId + '?' + queryParams);
    };

    var loadLocal = function() {
        $scope.serverPage = false;
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        initOfflineActions();
        selectedSubmission = [];
        if(type == "all") {
            $scope.pagination.init($rootScope.pageSize.value, 0, function() {
                submissionDao.getAllSubmissions($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize, $scope.searchStr || "")
                    .then(assignSubmissions, ErrorLoadingSubmissions);
            });
        }
        else if(type == "unsubmitted") {
            $scope.pagination.init($rootScope.pageSize.value, 0, function() {
                submissionDao.getUnsubmittedSubmissions($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize, $scope.searchStr || "")
                    .then(assignSubmissions, ErrorLoadingSubmissions);
            });
        }
    };

    $scope.search = function() {
        loadLocal();
    };

    // $scope.getChanges = function() {
    //     $scope.newSubmissions = [];
    //     $scope.updatedSubmissions = [];
    //     $scope.conflictSubmissions = [];
    //     var promises;
    //     localStore.getLastFetch($scope.project_uuid).then(function(result) {
    //         msg.hideLoadingWithInfo("Fetching submissions from " + result.last_fetch + "<br> <span> Refer notification for further details.</span>");
    //         dcsService.getSubmissionsFrom($scope.project_uuid, result.last_fetch).then(function(result) {
    //             promises = result.submissions.map(function(submission) { 
    //                                 return localStore.getSubmissionByuuid(submission.submission_uuid).then(function(result) {
    //                                     getTypeOf(submission, result);
    //                                 });
    //                             });
    //             app.promises(promises, function(results) {
    //                 var newSubmissionsPro = []; 
    //                 var updatedSubmissionsPro = []; 
    //                 var conflictSubmissionsPro = [];
    //                 localStore.updatelastFetch($scope.project_uuid, result.last_fetch);           

    //                 $scope.newSubmissions.forEach(function(submission) {
    //                     submission.status = "new";
    //                     newSubmissionsPro.push(localStore.createSubmission(submission));
    //                 });

    //                 $scope.updatedSubmissions.forEach(function(submission) {
    //                     submission.status = "Both";
    //                     updatedSubmissionsPro.push(localStore.updateSubmission(submission));
    //                 });

    //                 $scope.conflictSubmissions.forEach(function(submission) {
    //                     conflictSubmissionsPro.push(localStore.updateSubmissionStatus(submission.submission_uuid, "conflict"));
    //                 });

    //                 app.promises(newSubmissionsPro, function() {
    //                     if($scope.newSubmissions != 0) {
    //                         loadSubmissions(0); 
    //                         msg.addInfo($scope.newSubmissions.length + " submission added.", "#submission-list/" + $scope.project_uuid);
    //                     }
    //                 });

    //                 app.promises(updatedSubmissionsPro, function() {
    //                     if($scope.updatedSubmissions != 0) {
    //                         loadSubmissions(0); 
    //                         msg.addInfo($scope.updatedSubmissions.length + " submission updated.", "#submission-list/" + $scope.project_uuid);
    //                     }
    //                 });

    //                 app.promises(conflictSubmissionsPro, function() {
    //                     if($scope.conflictSubmissions != 0) 
    //                         msg.addInfo($scope.conflictSubmissions.length + " submission are in conflict.", "#conflict-submission-list/" + $scope.project_uuid);
                        
    //                 });
    //             });
    //         });
    //     }); 
    // };

    // var getTypeOf = function(submission, result) {
    //     if(result.length==0) 
    //         $scope.newSubmissions.push(submission);
    //     else
    //     {
    //         submission.submission_id = result[0].submission_id;
    //         if(submission.version != result[0].version)
    //             if(Boolean(result[0].is_modified))
    //                 $scope.conflictSubmissions.push(submission);
    //             else
    //                 $scope.updatedSubmissions.push(submission);
    //     }
    // };

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
                loadLocal();
                msg.hideLoadingWithInfo("Submission(s) deleted");
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
        $scope.title = resourceBundle.serversubmissionTitle;
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
        selectedSubmission = [];
        backHandler.setToSubmissions();
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        initServerActions();
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            dcsService.getSubmissions($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
            .then(assignServerSubmissions, ErrorLoadingSubmissions);
        });

    };

    var updateSubmissions = function(submissions) {
        msg.showLoading();
        var promises = [];

        dcsService.checkSubmissionsStatus($scope.project_uuid, submissions).then(function(response){
            for (var status in response) {
                promises.push(submissionDao.updateSubmissionStatus(response[status], status)); 
            };

            $q.all(promises).then(function() {
                loadLocal();
                (505).showInfo();
            }, (107).showError);
        });
    };

    var onUpdate = function() {
        if(selectedSubmission.length != 0) {
            submissionDao.getSubmissionForUpdate(selectedSubmission).then(function(submissions) {
                updateSubmissions(submissions);
            });
        }
        else {
            dialogService.confirmBox('Do you want to update all submissions?', function() {
                submissionDao.getAllSSubmissionForUpdate($scope.project_uuid).then(function(submissions){
                    updateSubmissions(submissions);
                });
            });
        }
    };

    var initOfflineActions =  function() {
        $scope.actions = [];
        $scope.actions.push({'onClick': onDelete, 'label': 'Delete' });
        $scope.actions.push({'onClick': onPost, 'label': 'Submit Submissions'});
        $scope.actions.push({'onClick': onNew, 'label': 'Make submission'});
        $scope.actions.push({'onClick': loadServer, 'label': 'Pull Submissions'});
        $scope.actions.push({'onClick': onUpdate, 'label': 'Check Status'});
        $scope.title = resourceBundle.localsubmissionTitle;
    };

    $scope.onSubmissionSelect = function(submissionRow, submission) {
        submissionRow.selected = !submissionRow.selected;
        app.flipArrayElement(selectedSubmission, submission.submission_id);
    };

    loadLocal();
};

dcsApp.controller('submissionListController', ['$rootScope', 'app', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'paginationService', 'dialogService', submissionListController]);

