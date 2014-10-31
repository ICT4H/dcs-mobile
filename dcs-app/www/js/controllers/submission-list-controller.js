dcsApp.controller('submissionListController', 
    ['$rootScope', 'app', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService',
    function($rootScope, app, $scope, $q, $routeParams, $location, dcsService, localStore, msg){

    $scope.pageSizes = $rootScope.pageSizes;
    $scope.pageSize = $rootScope.pageSize.value;
    $scope.searchFields = {all: 'All'};  
    $scope.displayHeaders = {}; 
    $scope.orderHeaders = []; 
    $scope.showActions = false;
    $scope.Math = window.Math;
    $scope.total = 0;
    msg.showLoadingWithInfo('Loading submissions');
        
    var MODIFIED = 1;
    var UNMODIFIED = 0;
    var selectedCount = 0;
    var serverSubmissions = [];
    var selected = [];
    $scope.conflictSubmissionCount = 0;

    $scope.project_uuid = $routeParams.project_uuid;
    $scope.outdateProject = false;
    $scope.deletedProject = false;

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

    var loadSubmissions = function(pageNumber) {
        $scope.pageNumber = pageNumber;
        localStore.getCountOfSubmissions($scope.project_uuid).then(function(result){
            $scope.total = result.total;
        });
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        localStore.getSubmissionsByProjectId($scope.project_uuid, pageNumber * $scope.pageSize, $scope.pageSize)
        .then(assignSubmissions, ErrorLoadingSubmissions);
        msg.hideAll();
    };

    $scope.onLoad = function() {
        localStore.getProjectById($scope.project_uuid)
            .then(function(project) {
                $scope.project_name = project.name;
                $scope.project_uuid = project.project_uuid;
                $scope.headers = JSON.parse(project.headers);
                $scope.orderHeaders = app.extractHeaders($scope.headers);
                angular.extend($scope.searchFields, app.getSearchFields($scope.headers));
                // setObseleteProjectWarning(project_uuidject);
                loadSubmissions(0);
        });
    };
    $scope.onLoad();

    $scope.onNext = function(pageNumber) {
        loadSubmissions(pageNumber);
    };

    $scope.onPrevious = function(pageNumber) {
        loadSubmissions(pageNumber);
    };

    $scope.isLastPage = function() {
        return Math.ceil($scope.total/$scope.pageSize) == $scope.pageNumber + 1;
    };

    $scope.isFirstPage = function() {
        return $scope.pageNumber == 0;
    };

    $scope.isAtLast = function(index) {
        if($scope.isLastPage())
            return index ==  $scope.total % $scope.pageSize - 1 ;
        return index == $scope.pageSize-1;
    }
    
    $scope.isSubmissionDisplayable = function(submissionData) {
        return app.isSubmissionDisplayable(submissionData.data, $scope.searchStr, $scope.selectedField);
    }

    $scope.formatSubmission = function(index, submission) {
        var ret = '';
        $scope.listIndex = index;
        angular.forEach($scope.orderHeaders, function(header) {
              if(header == "more") 
                ret += "<td><a href='#project/" + submission.project_uuid + "/submission/" + submission.submission_id + "' style='font-weight: bolder;'>more</a></td>";
            else
                ret += "<td>" + submission.data[header] + "</td>";
        });
        return ret;
    };

    $scope.getChanges = function() {
        $scope.newSubmissions = [];
        $scope.updatedSubmissions = [];
        $scope.conflictSubmissions = [];
        var promises;
        localStore.getLastFetch($scope.project_uuid).then(function(result) {
            if(result.last_fetch == "0")
                msg.hideLoadingWithInfo("Fetching all submission. <br> <span style='margin-top:5px;'> Refer notification for further details. <span>"  );
            else
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

    $scope.createSurveyResponse = function() {
        $location.path('/project/' + $scope.project_uuid + '/submission/' + null);
    };

    $scope.editSurveyResponse = function() {
        if(selectedCount==1) {
            $location.path('/project/' + $scope.project_uuid + '/submission/' + selected[0]);
            return;
        }
        msg.displayInfo('you can edit only one submission at a time !');

    };

    $scope.update_selected_submissions = function(submissionRow) {
        submissionRow.selected = !submissionRow.selected;
        app.flickArray(selected, submissionRow.item.submission_id);
        $scope.showActions = (selected.length >= 1);
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
        selected.forEach(function(submissionId) {
            multiplePromises.push(
                localStore.getSubmissionById(submissionId)
                    .then(dcsService.postSubmissionAndPurgeObsoluteMedia)
                    .then(dcsService.postSubmissionNewMedia)
                    .then(localStore.updateSubmission));
        });
        return multiplePromises;
    };

    $scope.postSubmissions = function() {
        msg.showLoading();
        $q.all(post_selected_submissions())
        .then(function(){
            msg.hideLoadingWithInfo('Submitted successfully');
        },function(error){
            msg.hideLoadingWithErr('something went wrong ' + error);
        });
    };

    $scope.deleteSubmissions = function() {
        msg.showLoading();
        function onConfirm(buttonIndex) {
            if(buttonIndex==BUTTON_NO) return;

            localStore.deleteSubmissions(selected)
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
}]);
