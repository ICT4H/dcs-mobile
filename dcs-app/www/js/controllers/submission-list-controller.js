var submissionListController = function($rootScope, app, $scope, $q, $routeParams, $location, dcsService, localStore, msg, paginationService, contextService){

    $scope.pagination = paginationService.pagination;
    $scope.actions = {};
    
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

    $scope.toggleSearch = function() {
        $scope.showSearch = !$scope.showSearch;
    };

    var assignSubmissions = function(submissions){
        $scope.submissions = submissions;
        contextService.isListing = true;
        contextService.submissions = submissions;
        msg.hideAll();
    };

    var ErrorLoadingSubmissions = function(data, error) {
        msg.hideLoadingWithErr('Failed to load Submissions');
    };

    var loadLocal = function() {
        $scope.serverPage = false;
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        initOfflineActions();

        if(type == "all") {
            $scope.pagination.init($rootScope.pageSize.value, 0, function() {
                localStore.getCountOfSubmissions($scope.project_uuid).then(function(result){
                    $scope.pagination.totalElement = result.total;
                });
                localStore.getSubmissionsByProjectId($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
                    .then(assignSubmissions, ErrorLoadingSubmissions);
            });
        }
        else if(type == "unsubmitted") {

        }
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

    $scope.editSurveyResponse = function() {
        if(selectedCount==1) {
            $location.path('/project/' + $scope.project_uuid + '/submission/' + selected[0]);
            return;
        }
        msg.displayInfo('you can edit only one submission at a time !');
    };

    var post_selected_submissions = function() {
        var multiplePromises = [];
        selectedSubmission.forEach(function(submissionId) {
            multiplePromises.push(
                localStore.getSubmissionById(submissionId)
                    .then(dcsService.postSubmissionAndPurgeObsoluteMedia)
                    .then(dcsService.postSubmissionNewMedia)
                    .then(localStore.updateSubmission));
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
            msg.hideLoadingWithErr('something went wrong ' + error);
        });
    };

    var onDelete = function() {
        if(!app.areItemSelected(selectedSubmission)) return;

        function onConfirm(buttonIndex) {
            if(buttonIndex==BUTTON_NO) return;
            msg.showLoading();
            localStore.deleteSubmissions(selectedSubmission)
            .then(function(){
                loadLocal();
                msg.hideLoadingWithInfo("Submission(s) deleted");
            }
            ,function(error){
                console.log(error);
                msg.hideLoadingWithErr("Submission(s) deletion failed "+error)
            });
        };

        navigator.notification.confirm(
            'Do you want to delete ?',
            onConfirm,
            'Delete submission',
            ['Yes','No']
        );
    };

    var onNew = function() {
        contextService.isListing = false;
        $location.path('/project/' + $scope.project_uuid + '/submission/' + null);
    };

    $scope.downloadSubmission = function(submission) {
        msg.showLoading();
        submission.status = BOTH;
        dcsService.getSubmission(submission)
            .then(localStore.createSubmission)
            .then(function(resp) {
                submission.submission_id = resp.submission_id;
                submission.data = resp.data;
                submission.xml = resp.xml;
                msg.hideLoadingWithInfo("Submission downloaded.");
            }, function(error) {
                msg.hideLoadingWithErr('Unable to download submission.');
            });
    };

    function loadLocalSubmissionUuid(submission_uuid) {
        var deferred = $q.defer();

        localStore.getsubmissionUuidByUuid(submission_uuid)
            .then(function(result) {
                console.log('getsubmissionUuidByUuid uuid: ' + submission_uuid + '; submission found: ' + result.length);
                if (result.length == 0)
                    deferred.resolve(submission_uuid);
                else
                    deferred.resolve();
            }, deferred.reject);

        return deferred.promise;
    };

    function downloadNonLocalSubmissions(localSubmissionPromises) {
        var deferred = $q.defer();
        var submissionDownloaders = [];

        $q.all(localSubmissionPromises)
            .then(function(results) {
                results.forEach(function(nonLocalSubmissionUuid) {
                    console.log('nonLocalSubmissionUuid: ' + nonLocalSubmissionUuid);
                    if (nonLocalSubmissionUuid) {
                        submissionDownloaders.push(
                            downloadSubmission({submission_uuid: nonLocalSubmissionUuid,
                                                project_uuid:$scope.project_uuid}));
                    }
                });
                deferred.resolve(submissionDownloaders);

            }, function(e) {
                console.log('Error during submission download: ' + e);
            });
        return deferred.promise;
    };

    var downloadSubmission = function(submission) {
        submission.status = BOTH;
        return dcsService.getSubmission(submission)
            .then(dcsService.getSubmissionMedia)
            .then(localStore.createSubmission);      
    };

    var onDownload = function() {
        msg.showLoading();
        var localSubmissionPromises = [];

        selectedSubmission.forEach(function(submission_uuid) {
            // adding to array needs to be sync.
            localSubmissionPromises.push(loadLocalSubmissionUuid(submission_uuid));
        });

        console.log('localSubmissionPromises.length: ' + localSubmissionPromises.length);

        downloadNonLocalSubmissions(localSubmissionPromises)
            .then(function(submissionDownloaders) {

                $q.all(submissionDownloaders)
                    .then(function(results) {
                        msg.hideLoadingWithInfo("Submission downloaded.");
                    }, function(e) {
                        msg.hideLoadingWithErr('Unable to download submission.');
                    });
            });
    };

    var initServerActions =  function() {
        $scope.actions = {};
        $scope.actions['download'] = {'onClick': onDownload, 'label': 'Download'};
    };

    var createSubmissions = function(results) {
        var submissions = [];
        angular.forEach(results, function(item) {
            submissions.push({'date': item[2]});
        });
        return submissions;
    };

    var assignServerSubmissions = function(response) {
        msg.hideAll();
        submissions = createSubmissions(response.data);
        $scope.pagination.totalElement = response.total;
        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No server submissions !');

        $scope.submissions = submissions;
    };

    var loadServer = function() {
        $scope.serverPage = true;
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        initServerActions();
        $scope.pagination.init($rootScope.pageSize.value, 0, function() {
            dcsService.getSubmissions($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
            .then(assignServerSubmissions, ErrorLoadingSubmissions);
        });

    };

    var onUpdate = function() {};

    var initOfflineActions =  function() {
        $scope.actions = {};
        $scope.actions['delete'] = {'onClick': onDelete, 'label': 'Delete' };
        $scope.actions['push'] = {'onClick': onPost, 'label': 'Submit Submissions'};
        $scope.actions['new'] = {'onClick': onNew, 'label': 'Make submission'};
        $scope.actions['pull'] = {'onClick': loadServer, 'label': 'Pull Submissions'};
        $scope.actions['update'] = {'onClick': onUpdate, 'label': 'Update'};
    };

    $scope.onSubmissionSelect = function(submissionRow, submission) {
        submissionRow.selected = !submissionRow.selected;
        app.flipArrayElement(selectedSubmission, submission.submission_id);
    };

    loadLocal();
};

dcsApp.controller('submissionListController', ['$rootScope', 'app', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'paginationService', 'contextService', submissionListController]);

