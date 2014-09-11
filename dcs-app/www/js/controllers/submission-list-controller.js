dcsApp.controller('submissionListController', 
    ['$rootScope', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', '$sce',
    function($rootScope, $scope, $q, $routeParams, $location, dcsService, localStore, msg, $sce){

    $scope.pageTitle = "Submissions";
    $scope.pageSizes = [5, 10, 15, 20];
    $scope.searchFields = {all: 'All'};  
    $scope.displayHeaders = {}; 
    $scope.orderHeaders = []; 
    $scope.show = false;
    var exculdeHeaders = {'ds_name': 'ds_name', 'date':'date'};
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

    var getSearchFields = function(headers, parent) {
        for (var key in headers) {
            var value = headers[key];
            if(parent != undefined)
                key = parent + "-" + key;
            if(value.constructor == {}.constructor) {
                getSearchFields(value, key);
                continue;                
            }
            if(!exculdeHeaders.hasOwnProperty(key))
                $scope.searchFields[key] = value;
        }
    };

    var extractHeaders = function(headers) {
        var orderHeaders = [];
        var flag = false;
                
        angular.forEach(headers, function(value, key) { 
            if(typeof value != "object") {
                if(!exculdeHeaders.hasOwnProperty(key))
                    orderHeaders.push(key);
                flag = true;
            }
        }); 
        
        if(flag) 
            orderHeaders.push("more");
        return orderHeaders;
    };

    $scope.onLoad = function() {
        $scope.pageSize = {'value':$scope.pageSizes[0]};
        localStore.getProjectById(project_uuid)
            .then(function(project) {
                $scope.project_name = project.name;
                $scope.project_uuid = project.project_uuid;
                $scope.headers = JSON.parse(project.headers);
                $scope.orderHeaders = extractHeaders($scope.headers);
                getSearchFields($scope.headers);
                // setObseleteProjectWarning(project_uuidject);
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
    
    var searchInRepeat =  function(submission, searchStr, selectedField) {
        var level = selectedField.split("-");
        var flag = false;
        submission[level[0]].forEach(function(block) {
            if( block[level[1]].toLowerCase().indexOf(searchStr.toLowerCase()) >=0)
                flag = true;
        });
        return flag;
    };

    $scope.isSubmissionDisplayable = function(submissionData) {
        var submission = submissionData.data;
        var searchStr = $scope.searchStr;
        var selectedField = $scope.selectedField;

        if(!searchStr || !selectedField || selectedField =='all')
            return true;
        if(selectedField.indexOf("-") >= 0)
            return searchInRepeat(submission, searchStr, selectedField);
        if(submission[selectedField].toLowerCase().indexOf(searchStr.toLowerCase()) >= 0)
            return true;
        return false;
    };


    $scope.formatSubmission = function(submission) {
        var ret = '';
        angular.forEach($scope.orderHeaders, function(header) {
              if(header == "more") 
                ret += "<td><a href='#project/" + submission.project_uuid + "/submission/" + submission.submission_id + "'>more</a></td>";
            else
                ret += "<td>" + submission.data[header] + "</td>";
        });
        return ret;
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

    // $scope.createSurveyResponse = function() {
    //     $location.path('/project/' + project_uuid + '/submission/' + null);
    // };

    // $scope.editSurveyResponse = function() {
    //     if(selectedCount==1) {
    //         $location.path('/project/' + project_uuid + '/submission/' + getSelectedIds()[0]);
    //         return;
    //     }
    //     msg.displayInfo('you can edit only one submission at a time !');

    // };

    // var update_selected_submission_ids = function(submission_id) {

    //     var selected = selected_id_map;

    //     if (selected[submission_id]) {
    //         delete selected[submission_id];
    //         selectedCount--;
    //     } else {
    //         selected[submission_id] = true;
    //         selectedCount++;
    //     }
    //     console.log(selected);
    // };

    // $scope.update_selected_submissions = function(submissionRow) {
    //     submissionRow.selected = !submissionRow.selected;
    //     update_selected_submission_ids(submissionRow.item.submission_id);
    //     console.log('selectedCount: ' + selectedCount);



    //     if(selectedCount == 0) {
    //         $scope.showPagination = true;
    //         $scope.showActions= false;
    //     } else if(selectedCount == 1) {
    //             $scope.showEdit = true;
    //             $scope.showActions = true;
    //             $scope.showPagination = false;

    //     } else {
    //         $scope.showEdit = false;
    //         $scope.showActions = true;
    //         $scope.showPagination = false;
    //     }
    // };

    // var getSelectedIds = function() {
    //    return Object.keys(selected_id_map);
    // };

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

    // var post_selected_submissions = function() {
    //     var multiplePromises = [];
    //     for(submission_id in selected_id_map) {
    //         multiplePromises.push(
    //             localStore.getSubmissionById(submission_id)
    //             .then(dcsService.postSubmission)
    //             .then(localStore.updateSubmissionMeta));

    //     };
    //     return multiplePromises;
    // };

    // $scope.postSubmissions = function() {
    //     msg.showLoading();
    //     $q.all(post_selected_submissions())
    //     .then(function(){
    //         msg.hideLoadingWithInfo('Submitted successfully');
    //     },function(error){
    //         msg.hideLoadingWithErr('something went wrong '+error);
    //     });
    // };

    // $scope.deleteSubmissions = function() {
    //     msg.showLoading();
    //     function onConfirm(buttonIndex) {
    //         if(buttonIndex==BUTTON_NO) return;

    //         localStore.deleteSubmissions(getSelectedIds())
    //         .then(function(){
    //             loadSubmissions(0);
    //             msg.hideLoadingWithInfo("Submission(s) deleted");

    //         }
    //         ,function(error){
    //             console.log(error);
    //             msg.hideLoadingWithErr("Submission(s) deletion failed "+error)
    //         });
    //     };

    //     navigator.notification.confirm(
    //         'Do you want to delete ?',
    //         onConfirm,
    //         'Delete submission',
    //         ['Yes','No']
    //     );
    // };

    // $scope.downloadSubmission = function(submission) {
    //     msg.showLoading();
    //     submission.status = BOTH;
    //     dcsService.getSubmission(submission)
    //         .then(localStore.createSubmission)
    //         .then(function(resp) {
    //             submission.submission_id = resp.submission_id;
    //             submission.data = resp.data;
    //             submission.xml = resp.xml;
    //             msg.hideLoadingWithInfo("Submission downloaded.");
    //         }, function(error) {
    //             msg.hideLoadingWithErr('Unable to download submission.');
    //         });
    // };

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
