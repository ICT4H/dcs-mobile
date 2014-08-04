dcsApp.controller('submissionListController', 
    ['$rootScope', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'localStore', 'messageService',
    function($rootScope, $scope, $q, $routeParams, $location, dcsService, localStore, msg){

    $scope.pageTitle = "Submissions";
    $scope.pageSize = 5;

    msg.showLoadingWithInfo('Loading submissions');
    
    var MODIFIED = 1;
    var UNMODIFIED = 0;
    var project_id = $routeParams.project_id;
    var selectedCount = 0;
    var serverSubmissions = [];
    var selected_id_map = {};
    var metaField = ["date", "ds_id", "ds_name"];

    $scope.project_id = project_id;
    $scope.outdateProject = false;
    $scope.deletedProject = false;

    localStore.getProjectById(project_id)
        .then(function(project) {
            $scope.project_name = project.name;
            $scope.project_uuid = project.project_uuid;
            $scope.headerLabels = JSON.parse(project.header_labels);
            $scope.headers = JSON.parse(project.headers);
            delete $scope.headers.ds_name;
            delete $scope.headers.date;
            setObseleteProjectWarning(project);

            $scope.headerRows = createSubmissionHeaders($scope.headers, $scope.headerLabels);

            $scope.getSubmissions(0);
        });

    $scope.getSubmissions = function(start) {
        start = (typeof(start) == "number") ? start : 0;
        $scope.from = start + 1;

        localStore.getCountOfSubmissions(project_id)
            .then(function(total) {
                $scope.total = total;
                localStore.getAllProjectSubmissions(project_id,start,$scope.pageSize)
                    .then(function(submissions) {
                        $scope.submissions = submissions;
                        $scope.s = createSubmissionRows($scope.headers, $scope.submissions);

                        if(submissions.length <1) {
                            msg.hideLoadingWithInfo('No local submissions !');
                            return;
                        }
                        $scope.to = start + submissions.length;

                        $scope.next = start + $scope.pageSize;
                        $scope.prev = start - $scope.pageSize;

                        msg.hideAll();
                    },function(data,error) {
                        msg.hideLoadingWithErr(error+' Failed to load submissions');
                        console.log('Error while loading local submissions');
                    });
            },function() {
                console.log('Error while counting local submissions');
            });
    };

    var createSubmissionHeaders = function(headers, headerLabels) {

      var tableHeaders = [];
      var topQuestionNames = headers["_main"];
      var maxLength = (Object.keys(headers).length > 1) ? 2 : 0;

      var tableHeader = [];
      var repeatRows = [];
      topQuestionNames.forEach(function(topQuestionName) {
        var isRepeatQuestion = (undefined != headers[topQuestionName]);
        if (isRepeatQuestion) {
            tableHeader.push({
                l: headerLabels[topQuestionName],
                c: headers[topQuestionName].length,
                r: 0
            });
            var repeats = headers[topQuestionName];
            repeats.forEach(function(repeat) {
                repeatRows.push({
                    l: headerLabels[repeat],
                    c: 0,
                    r: 0
                });
            });
        } else {
            if (metaField.indexOf(topQuestionName) == -1) {
              tableHeader.push({
                l: headerLabels[topQuestionName],
                c: 0,
                r: maxLength
              });
            }
        }
      });
      tableHeaders.push(tableHeader);
      if (repeatRows.length > 0)
        tableHeaders.push(repeatRows);
      
      return tableHeaders;
    }

    var createSubmissionRows = function(headers, submissions) {
      var firstHeaderRow = headers["_main"];
      var submissionRows = [];
      submissions.forEach(function(s) {
        var submission = s.data;
        var maxLength = findMaxLength(submission);
        var srow = [];
        var repeatsInNewRow = []
        firstHeaderRow.forEach(function(firstHeaderCell) {
          var cell = {};
          var hasRepeat = (undefined != headers[firstHeaderCell]);
          if (hasRepeat) {
            var repeat = headers[firstHeaderCell];
            var repeatSubmission = submission[firstHeaderCell];
            repeatsInNewRow = [];
            repeatSubmission.forEach(function(repeatRow, i) {
                
                repeat.forEach(function(rName) {
                    cell = {};
                    cell["v"]=repeatRow[rName]; cell["r"]=0; cell["c"]=maxLength-repeatSubmission.length;
                    if (i==0)
                        srow.push(cell);
                    else
                        repeatsInNewRow.push(cell);
                });
            });
          } else {            
            if (metaField.indexOf(firstHeaderCell) == -1) {

                cell["v"]=submission[firstHeaderCell]; cell["r"]=maxLength+1; cell["c"]=0;
                srow.push(cell);
            }
          }
        });
        submissionRows.push(srow);
        if (repeatsInNewRow.length>0)
            submissionRows.push(repeatsInNewRow);
      });
      return submissionRows;
    }

    var findMaxLength = function(object) {
      var maxLength = 0;
      Object.keys(object).forEach(function(key) {
      if (object.key instanceof Array ) {
        if (object[key].length > maxLength)
          maxLength = object[key].length;
      }
      });
      return maxLength;
    }

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
    }

     $scope.$refreshContents = function() {
        console.log('submissions refreshContents clicked');
        msg.showLoadingWithInfo('Fetching server submissions');
        $scope.submissions = [];

        localStore.getSubmissionVersions(project_id)
            .then(dcsService.checkSubmissionVersions)
            .then(updateSubmissionsToDisplay)
            .then($scope.getSubmissions, function(e){
                msg.hideLoadingWithErr('Unable to check submissions status')
            });
    };

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
            $location.path('/submission/conflict/id/' + getSelectedIds()[0] + '/project_id/' + project_id);
            return;
        }
        msg.displayInfo('You can resolve only one submission at a time');

    }

    $scope.createSurveyResponse = function() {
        $location.path('/project/' + project_id + '/submission/' + null);
    };

    $scope.editSurveyResponse = function() {
        if(selectedCount==1) {
            $location.path('/project/' + project_id + '/submission/' + getSelectedIds()[0]);
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
        } else {
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
                $scope.getSubmissions(0);
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
    $scope.do_next = function() {
        console.log('next clicked');
        var allow = $scope.total > $scope.next;
        if (allow)
            $scope.getSubmissions($scope.next);
    }

    $scope.do_prev = function() {
        console.log('prev clicked');
        var allow = $scope.prev >= 0;
        if (allow)
            $scope.getSubmissions($scope.prev);
    }

    $scope.onPageSizeChange = function() {
        msg.showLoadingWithInfo('Loading submissions');
        $scope.pageSize = parseInt($scope.pageSize);
        $scope.getSubmissions(0);
    }

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
