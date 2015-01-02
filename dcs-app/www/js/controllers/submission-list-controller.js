var submissionListController = function($rootScope, app, $scope, $q, $routeParams, $location, dcsService, localStore, msg, paginationService){

    $scope.pagination = paginationService.pagination;
    $scope.actions = {};
    
    $scope.searchFields = {all: 'All'};  

    var MODIFIED = 1;
    var UNMODIFIED = 0;
    var selectedCount = 0;
    var serverSubmissions = [];
    var selectedSubmission = [];
    $scope.conflictSubmissionCount = 0;

    $scope.project_uuid = $routeParams.project_uuid;
    $scope.outdateProject = false;
    $scope.deletedProject = false;
    $scope.showSearch = false;

    $scope.toggleSearch = function() {
        $scope.showSearch = !$scope.showSearch;
    };

    var assignSubmissions = function(submissions){
        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No local submissions !');
        submissions.forEach(function(submission){
            if(submission.status == "conflict")
                $scope.conflictSubmissionCount = $scope.conflictSubmissionCount + 1;
            submission.data = JSON.parse(submission.data);
        });
        if($scope.conflictSubmissionCount > 0) 
            msg.addInfo($scope.conflictSubmissionCount + " submission are in conflict.", "#conflict-submission-list/" + $scope.project_uuid);
        $scope.submissions = submissions;
    };

    var ErrorLoadingSubmissions = function(data, error) {
        msg.hideLoadingWithErr('Failed to load Submissions');
    };

    var loadSubmissions = function() {
        localStore.getCountOfSubmissions($scope.project_uuid).then(function(result){
            $scope.pagination.totalElement = result.total;
        });
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        localStore.getSubmissionsByProjectId($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
            .then(assignSubmissions, ErrorLoadingSubmissions);
        msg.hideAll();
    };

    $scope.onLoad = function() {
        $scope.pagination.init($rootScope.pageSize.value, 0, loadSubmissions);
        getProjectFromCache($scope.project_uuid).then(function(project) {
            processProject(project);
            loadSubmissions();
            initActions();
        });
    };

    function getProjectFromCache(project_uuid) {
        $rootScope.currentProject = $rootScope.currentProject || {project_uuid: ''};
        var project_in_cache = project_uuid == $rootScope.currentProject.project_uuid;
        var deferred = $q.defer();

        if (project_in_cache) {
            deferred.resolve($rootScope.currentProject);
        } else {
            localStore.getProjectById($scope.project_uuid)
                .then(function(project) {
                    $rootScope.currentProject = project;
                    deferred.resolve(project)
            });
        }
        return deferred.promise;
    }

    function processProject(project) {
        $scope.project_name = project.name;
        $scope.project_uuid = project.project_uuid;
        $scope.headers = JSON.parse(project.headers);
        $scope.orderHeaders = app.extractHeaders($scope.headers);
        angular.extend($scope.searchFields, app.getSearchFields($scope.headers));
        // setObseleteProjectWarning(project_uuidject);
    }

    $scope.onLoad();
    
    $scope.isSubmissionDisplayable = function(submissionData) {
        return app.isSubmissionDisplayable(submissionData.data, $scope.searchStr, $scope.selectedField);
    }

    $scope.getChanges = function() {
        $scope.newSubmissions = [];
        $scope.updatedSubmissions = [];
        $scope.conflictSubmissions = [];
        var promises;
        localStore.getLastFetch($scope.project_uuid).then(function(result) {
            msg.hideLoadingWithInfo("Fetching submissions from " + result.last_fetch + "<br> <span> Refer notification for further details.</span>");
            dcsService.getSubmissionsFrom($scope.project_uuid, result.last_fetch).then(function(result) {
                promises = result.submissions.map(function(submission) { 
                                    return localStore.getSubmissionByuuid(submission.submission_uuid).then(function(result) {
                                        getTypeOf(submission, result);
                                    });
                                });
                app.promises(promises, function(results) {
                    var newSubmissionsPro = []; 
                    var updatedSubmissionsPro = []; 
                    var conflictSubmissionsPro = [];
                    localStore.updatelastFetch($scope.project_uuid, result.last_fetch);           

                    $scope.newSubmissions.forEach(function(submission) {
                        submission.status = "new";
                        newSubmissionsPro.push(localStore.createSubmission(submission));
                    });

                    $scope.updatedSubmissions.forEach(function(submission) {
                        submission.status = "Both";
                        updatedSubmissionsPro.push(localStore.updateSubmission(submission));
                    });

                    $scope.conflictSubmissions.forEach(function(submission) {
                        conflictSubmissionsPro.push(localStore.updateSubmissionStatus(submission.submission_uuid, "conflict"));
                    });

                    app.promises(newSubmissionsPro, function() {
                        if($scope.newSubmissions != 0) {
                            loadSubmissions(0); 
                            msg.addInfo($scope.newSubmissions.length + " submission added.", "#submission-list/" + $scope.project_uuid);
                        }
                    });

                    app.promises(updatedSubmissionsPro, function() {
                        if($scope.updatedSubmissions != 0) {
                            loadSubmissions(0); 
                            msg.addInfo($scope.updatedSubmissions.length + " submission updated.", "#submission-list/" + $scope.project_uuid);
                        }
                    });

                    app.promises(conflictSubmissionsPro, function() {
                        if($scope.conflictSubmissions != 0) 
                            msg.addInfo($scope.conflictSubmissions.length + " submission are in conflict.", "#conflict-submission-list/" + $scope.project_uuid);
                        
                    });
                });
            });
        }); 
    };

    var getTypeOf = function(submission, result) {
        if(result.length==0) 
            $scope.newSubmissions.push(submission);
        else
        {
            submission.submission_id = result[0].submission_id;
            if(submission.version != result[0].version)
                if(Boolean(result[0].is_modified))
                    $scope.conflictSubmissions.push(submission);
                else
                    $scope.updatedSubmissions.push(submission);
        }
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
    // $scope.$refreshContents = function() {
    //     console.log('submissions refreshContents clicked');
    //     msg.showLoadingWithInfo('Fetching server submissions');
    //     $scope.submissions = [];

    //     localStore.getSubmissionVersions(project_uuid)
    //         .then(function(submissions){
    //             var sub={};
    //             submissions.forEach(function(submission){
    //                 sub[submission.submission_uuid] = submission.version;
    //             })
    //             return dcsService.checkSubmissionVersions(sub);
    //         })
    //         .then(updateSubmissionsToDisplay)
    //         .then($scope.loadSubmissions, function(e){
    //             msg.hideLoadingWithErr('Unable to check submissions status')
    //         });
    // };

    // var updateSubmissionsToDisplay = function(id_status_dict) {
    //     var updatePromises = [];

    //     angular.forEach(id_status_dict, function(submission_uuids, status) {
    //         if (submission_uuids.length > 0) {
    //             updatePromises.push(
    //                 localStore.updateSubmissionsStatus(submission_uuids, status));
    //         };
    //     });

    //     return $q.all(updatePromises);
    // };

    // $scope.compare = function(localSubmission) {
    //     localSubmission.project_uuid = $scope.project_uuid;
    //     dcsService.getSubmission(localSubmission)
    //         .then(function(serverSubmission) {
    //             serverSubmission.status = BOTH;
    //             localSubmission.serverSubmission = serverSubmission;
    //             msg.hideAll();
    //         }, function(e){
    //             msg.hideLoadingWithErr('Failed to get server submission');
    //         });
    // }

    $scope.editSurveyResponse = function() {
        if(selectedCount==1) {
            $location.path('/project/' + $scope.project_uuid + '/submission/' + selected[0]);
            return;
        }
        msg.displayInfo('you can edit only one submission at a time !');
    };

    // $scope.syncWithServer = function() {
    //     for(submission_id in selected_id_map) {
    //         localStore.getSubmissionById(submission_id)
    //             .then(function(submission) {
    //                 if(angular.isUndefined(submission.submission_uuid) 
    //                     || submission.submission_uuid == "undefined") {
    //                     dcsService.postSubmission(submission)
    //                         .then(localStore.updateSubmissionMeta)
    //                         .then(function() {
    //                             console.log('submitted '+submission.submission_id);
    //                         },function(error) {
    //                             msg.displayError('error '+error);
    //                         });
    //                     return;
    //                 }
    //                 $scope.compare(submission);
    //             }, function(error) {
    //             console.log('error '+error);
    //         })
    //     }
    // };

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

    var onSubmit = function() {
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
                $scope.showActions = false;
                loadSubmissions(0);
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

    var assignServerSubmissions = function(submissions){
        msg.hideAll();
        $scope.pagination.totalElement = submissions.total;
        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No server submissions !');
        $scope.submissions = submissions.data;
    };

    var loadServerSubmissions = function() {
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        dcsService.getSubmissions($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
            .then(assignServerSubmissions, ErrorLoadingSubmissions);
    };

    var loadServer = function() {
        $scope.pagination.init($rootScope.pageSize.value, 0, loadSubmissions);
        var project = $rootScope.currentProject;
        $scope.project_name = project.name;
        $scope.project_uuid = project.project_uuid;
        $scope.headers = JSON.parse(project.headers);
        $scope.orderHeaders = app.extractHeaders($scope.headers);
        initServerActions();
        loadServerSubmissions();
    };

    var onSurveyPull = function() {
        loadServer();
    };


    // $scope.postSubmission = function(submission) {
    //     var submitAfterConfirm = function() {
    //     msg.showLoading();
    //     submission.status = BOTH;
    //     submission.is_modified = UNMODIFIED;
    //     dcsService.postSubmission(submission)
    //         .then(localStore.updateSubmissionMeta)
    //         .then(function() {
    //             msg.hideLoadingWithInfo('Submitted successfully');
    //         },function(error) {
    //             submission.is_modified = MODIFIED;
    //             msg.hideLoadingWithErr('Submitted to server, local status not updated.');
    //         });
    //     };
    //     if(submission.status == SERVER_DELETED){
    //         function onConfirm(buttonIndex) {
    //             if(buttonIndex==BUTTON_NO) return;
    //             submitAfterConfirm();
    //         };
    //         navigator.notification.confirm(
    //             'New submission will be created over server',
    //             onConfirm,
    //             'Post submission',
    //             ['Yes','No']
    //         );
    //         return;
    //     }
    //     submitAfterConfirm();
    // };
    var onUpdate =  function() {
        
    };

    var initActions =  function() {
        $scope.actions = {};
        $scope.actions['delete'] = {'onClick': onDelete, 'label': 'Delete' };
        $scope.actions['push'] = {'onClick': onSubmit, 'label': 'Submit Submissions'};
        $scope.actions['new'] = {'onClick': onNew, 'label': 'Make submission'};
        $scope.actions['pull'] = {'onClick': onSurveyPull, 'label': 'Pull Submissions'};
        $scope.actions['update'] = {'onClick': onUpdate, 'label': 'Update'};
    };

    $scope.onSubmissionSelect = function(submissionRow, submission) {
        submissionRow.selected = !submissionRow.selected;
        app.flipArrayElement(selectedSubmission, submission.submission_id);
    };
};

dcsApp.controller('submissionListController', ['$rootScope', 'app', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'paginationService', submissionListController]);

