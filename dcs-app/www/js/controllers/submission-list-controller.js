dcsApp.controller('submissionListController', 
    ['$rootScope', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService',
    function($rootScope, $scope, $q, $routeParams, $location, dcsService, localStore, msg){

    $scope.pageTitle = "Submissions";
    $scope.pageSizes = [5, 10, 15, 20];
    msg.showLoadingWithInfo('Loading submissions');
    
    var MODIFIED = 1;
    var UNMODIFIED = 0;
    var project_uuid = $routeParams.project_uuid;
    var selectedCount = 0;
    var serverSubmissions = [];
    var selected_id_map = {};

    $scope.project_uuid = project_uuid;
    $scope.outdateProject = false;
    $scope.deletedProject = false;

    var assignSubmissions = function(submissions){
        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No local submissions !');
        submissions.forEach(function(submission){
            submission.data = JSON.parse(submission.data);
        });
        $scope.submissions = submissions;
    };

    var ErrorLoadingSubmissions = function(data,error) {
        msg.hideLoadingWithErr(error+' Failed to load Submissions');
    };
    var loadSubmissions = function(pageNumber) {
        $scope.pageNumber = pageNumber;
        localStore.getCountOfSubmissions($scope.project_uuid).then(function(result){
            $scope.total = result.total;
        });
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        localStore.getSubmissionsByProjectId($scope.project_uuid, pageNumber * $scope.pageSize.value, $scope.pageSize.value)
        .then(assignSubmissions, ErrorLoadingSubmissions);
        msg.hideAll();
    };

    $scope.onLoad = function() {
        $scope.pageSize = {'value':$scope.pageSizes[0]};
        localStore.getProjectById(project_uuid)
            .then(function(project) {
                $scope.project_name = project.name;
                $scope.project_uuid = project.project_uuid;
                $scope.headers = JSON.parse(project.headers);
                delete $scope.headers.ds_name;
                delete $scope.headers.date;
                setObseleteProjectWarning(project);
                loadSubmissions(0);
        });
    };
    $scope.onLoad();

    $scope.onNext = function(pageNumber) {
        if(pageNumber * $scope.pageSize.value < $scope.total)
            loadSubmissions(pageNumber);
    };

   $scope.onPrevious = function(pageNumber) {
        if (pageNumber >= 0) 
            loadSubmissions(pageNumber);
    };

    $scope.onPageSizeChange = function() {
        loadSubmissions(0);
    };

    var setObseleteProjectWarning = function(project) {
        delete $scope.projectWarning;

        if(project.status == OUTDATED) {
            $scope.outdateProject = true;
            $scope.projectWarning = 'The porject is outdated. You can only submit existing submissions.';
        }

        if(project.status == SERVER_DELETED) {
            $scope.deletedProject = true;
            $scope.projectWarning = 'No actions other that delete is premited since project is deleted from server';
        }
    };

    $scope.formatSubmission = function(value) {
        if (typeof value == "object") {
            var ret = '<table class="bg-transparent show-first-col no-margin-bottom table table-condensed">';
            ret += '<thead><tr>';
            
            for(k in value[0] || value) {
                ret += '<th>'+k+'</th>';
            }
            ret += '</tr></thead>';

            // multiple repeat data
            if (value instanceof Array) {
                for(var i in value) {
                    ret += '<tr>';
                    for (key in value[i]) {
                        ret += '<td>' + value[i][key] + '</td>';
                    }
                    ret += '</tr>';
                }
            // single repeat data
            } else {
                ret += '<tr>';
                for(var i in value) {
                    ret += '<td>' + value[i] + '</td>';
                }
                ret += '</tr>';
            }
            return ret += '</table>';
        }

        return value;
    }

    $scope.$refreshContents = function() {
        console.log('submissions refreshContents clicked');
        msg.showLoadingWithInfo('Fetching server submissions');
        $scope.submissions = [];

        localStore.getSubmissionVersions(project_uuid)
            .then(function(submissions){
                var sub={};
                submissions.forEach(function(submission){
                    sub[submission.submission_uuid] = submission.version;
                })
                return dcsService.checkSubmissionVersions(sub);
            })
            .then(updateSubmissionsToDisplay)
            .then($scope.loadSubmissions, function(e){
                msg.hideLoadingWithErr('Unable to check submissions status')
            });
    };

    var groupOnStatus = function(localSubmissions) {
        var statusLocal = [];
        var statusNonLocal = [];
        localSubmissions.forEach(function(submission) {
            if (submission.status == LOCAL) {
                statusLocal.push(submission);
            } else {
                statusNonLocal.push(submission);
            }
        });
        return {'local':statusLocal, 'non-local':statusNonLocal};
    }

    var updateSubmissionsToDisplay = function(id_status_dict) {
        var updatePromises = [];

        angular.forEach(id_status_dict, function(submission_uuids, status) {
            if (submission_uuids.length > 0) {
                updatePromises.push(
                    localStore.updateSubmissionsStatus(submission_uuids, status));
            };
        });

        return $q.all(updatePromises);
    };

    $scope.resolve = function() {
        if(selectedCount==1) {
            $location.path('/submission/conflict/id/' + getSelectedIds()[0] + '/project_uuid/' + project_uuid);
            return;
        }
        msg.displayInfo('You can resolve only one submission at a time');

    }

    $scope.compare = function(localSubmission) {
        localSubmission.project_uuid = $scope.project_uuid;
        dcsService.getSubmission(localSubmission)
            .then(function(serverSubmission) {
                serverSubmission.status = BOTH;
                localSubmission.serverSubmission = serverSubmission;
                msg.hideAll();
            }, function(e){
                msg.hideLoadingWithErr('Failed to get server submission');
            });
    }

    $scope.createSurveyResponse = function() {
        $location.path('/project/' + project_uuid + '/submission/' + null);
    };

    $scope.editSurveyResponse = function() {
        if(selectedCount==1) {
            $location.path('/project/' + project_uuid + '/submission/' + getSelectedIds()[0]);
            return;
        }
        msg.displayInfo('you can edit only one submission at a time !');

    };

    var update_selected_submission_ids = function(submission_id) {

        var selected = selected_id_map;

        if (selected[submission_id]) {
            delete selected[submission_id];
            selectedCount--;
        } else {
            selected[submission_id] = true;
            selectedCount++;
        }
        console.log(selected);
    };

    $scope.update_selected_submissions = function(submissionRow) {
        submissionRow.selected = !submissionRow.selected;
        update_selected_submission_ids(submissionRow.item.submission_id);
        console.log('selectedCount: ' + selectedCount);



        if(selectedCount == 0) {
            $scope.showPagination = true;
            $scope.showActions= false;
        } else if(selectedCount == 1) {
                $scope.showEdit = true;
                $scope.showActions = true;
                $scope.showPagination = false;

        } else {
            $scope.showEdit = false;
            $scope.showActions = true;
            $scope.showPagination = false;
        }
    };

    var getSelectedIds = function() {
       return Object.keys(selected_id_map);
    };

    $scope.syncWithServer = function() {
        for(submission_id in selected_id_map) {
            localStore.getSubmissionById(submission_id)
                .then(function(submission) {
                    if(angular.isUndefined(submission.submission_uuid) 
                        || submission.submission_uuid == "undefined") {
                        dcsService.postSubmission(submission)
                            .then(localStore.updateSubmissionMeta)
                            .then(function() {
                                console.log('submitted '+submission.submission_id);
                            },function(error) {
                                msg.displayError('error '+error);
                            });
                        return;
                    }
                    $scope.compare(submission);
                }, function(error) {
                console.log('error '+error);
            })
        }
    };

    var post_selected_submissions = function() {
        var multiplePromises = [];
        for(submission_id in selected_id_map) {
            multiplePromises.push(
                localStore.getSubmissionById(submission_id)
                .then(dcsService.postSubmission)
                .then(localStore.updateSubmissionMeta));

        };
        return multiplePromises;
    };

    $scope.postSubmissions = function() {
        msg.showLoading();
        $q.all(post_selected_submissions())
        .then(function(){
            msg.hideLoadingWithInfo('Submitted successfully');
        },function(error){
            msg.hideLoadingWithErr('something went wrong '+error);
        });
    };

    $scope.deleteSubmissions = function() {
        msg.showLoading();
        function onConfirm(buttonIndex) {
            if(buttonIndex==BUTTON_NO) return;

            localStore.deleteSubmissions(getSelectedIds())
            .then(function(){
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

    $scope.postSubmission = function(submission) {
        var submitAfterConfirm = function() {
        msg.showLoading();
        submission.status = BOTH;
        submission.is_modified = UNMODIFIED;
        dcsService.postSubmission(submission)
            .then(localStore.updateSubmissionMeta)
            .then(function() {
                msg.hideLoadingWithInfo('Submitted successfully');
            },function(error) {
                submission.is_modified = MODIFIED;
                msg.hideLoadingWithErr('Submitted to server, local status not updated.');
            });
        };
        if(submission.status == SERVER_DELETED){
            function onConfirm(buttonIndex) {
                if(buttonIndex==BUTTON_NO) return;
                submitAfterConfirm();
            };
            navigator.notification.confirm(
                'New submission will be created over server',
                onConfirm,
                'Post submission',
                ['Yes','No']
            );
            return;
        }
        submitAfterConfirm();
    };

    var prettifyDate = function(serverDate) {
        var now = new Date(serverDate);
        var date = now.toLocaleDateString();
        var time = now.toLocaleTimeString();
        time = time.replace(time.slice(time.length-6,time.length-3),'');
        return date.concat(' '+time);
    };

    var updateScopeSubmission = function(submission) {
        if (submission.status == BOTH) {
            submission.status = SERVER;
        } else {
            $scope.submissions.splice($scope.submissions.indexOf(submission), 1);
        }
    };
}]);
