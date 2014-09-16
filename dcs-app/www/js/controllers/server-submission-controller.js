dcsApp.controller('serverSubmissionController', ['app', '$scope', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService',
    function(app, $scope, $routeParams, $location, dcsService, localStore, msg){

    $scope.pageTitle = "Server";
    msg.showLoadingWithInfo('Loading submissions');
    $scope.displayHeaders = {}; 
    $scope.orderHeaders = []; 
    $scope.searchFields = {all: 'All'}; 
    $scope.showActions = false;  
    $scope.pageSizes = [5, 10, 15, 20];
    $scope.total =1;
    $scope.project_uuid = $routeParams.project_uuid;
    var selected = [];

    var assignSubmissions = function(submissions){
        msg.hideAll();
        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No server submissions !');
        $scope.submissions = submissions.data;
    };

    $scope.isSubmissionDisplayable = function(submission) {
        if(!$scope.searchStr || !$scope.selectedField)
            return true;
        
        if(submission.data[$scope.selectedField].indexOf($scope.searchStr) >= 0)
            return true;
        return false;
    };

    var ErrorLoadingSubmissions = function(data, error) {
        msg.hideLoadingWithErr(error+' Failed to load Submissions');
    };

    var loadSubmissions = function(pageNumber) {
        $scope.pageNumber = pageNumber;
        localStore.getCountOfSubmissions($scope.project_uuid).then(function(result){
            if(result.total!=0)
                $scope.total = result.total;
        });
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        dcsService.getSubmissions($scope.project_uuid, pageNumber * $scope.pageSize.value, $scope.pageSize.value)
        .then(assignSubmissions, ErrorLoadingSubmissions);
    };

    $scope.onLoad = function() {
        $scope.pageSize = {'value':$scope.pageSizes[0]};
        localStore.getProjectById($scope.project_uuid)
            .then(function(project) {
                $scope.project_name = project.name;
                $scope.project_uuid = project.project_uuid;
                $scope.headers = JSON.parse(project.headers);
                $scope.orderHeaders = app.extractHeaders($scope.headers);
                angular.extend($scope.searchFields, app.getSearchFields($scope.headers));
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

    $scope.isSubmissionDisplayable = function(submissionData) {
        return app.isSubmissionDisplayable(submissionData, $scope.searchStr, $scope.selectedField);
    }

    $scope.formatSubmission = function(submission) {
        var ret = '';
        angular.forEach($scope.orderHeaders, function(header) {
              if(header == "more") 
                ret += "<td><a class='fa fa-lg fa-external-link' href='#project/" + $scope.project_uuid + "/submission/" + submission.id[0] + "?server=true'></a></td>";
            else
                ret += "<td>" + submission[header] + "</td>";
        });
        return ret;
    };

    $scope.download = function() {
        msg.showLoading();
        var downloadSubmissionPromise = [];
        selected.forEach(function(submissionId) {
            localStore.submissionNotExists(submissionId).then(function(result) {
                if(result.length == 0)
                    downloadSubmissionPromise.push(downloadSubmission({submission_uuid: submissionId, project_uuid:$scope.project_uuid}));
            });
        });

        app.promises(downloadSubmissionPromise, function(resp) {
                msg.hideLoadingWithInfo("Submission downloaded.");
            }, function(error) {
                msg.hideLoadingWithErr('Unable to download submission.');
            });
    };

    // $scope.download = function() {
    //     console.log('download clicked');
    //     var selected_rows = document.getElementById('server-submissions').getElementsByClassName('success');
    //     var uuid;
    //     for (var i=0; i<selected_rows.length; i++) {
    //         uuid = selected_rows[i].cells[0].innerText;
    //         localStore.submissionNotExists(uuid)
    //             .then(function(result) {
    //                 if(result) {
    //                     downloadSubmission({submission_uuid: uuid,
    //                                         project_uuid:$scope.project_uuid});
    //                 }
    //                 // TODO what to be done for existing submissions.
    //             });
    //     }
    // }

    $scope.update_selected_submissions = function(submissionRow) {
        submissionRow.selected = !submissionRow.selected;
        app.flickArray(selected, submissionRow.item.id[0]);
        $scope.showActions = (selected.length >= 1);
    };

    var downloadSubmission = function(submission) {
        submission.status = BOTH;
        dcsService.getSubmission(submission)
            .then(localStore.createSubmission);
            
    }
}]);
